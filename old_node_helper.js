/* MagicMirror²
 * Node Helper: MMM-MyTeams-Honours
 *
 * By JC's Celtic Man Cave
 * MIT Licensed.
 */
const SharedRequestManager = require("./shared-request-manager.js");
const requestManager = SharedRequestManager.getInstance();
const NodeHelper = require("node_helper");
const cheerio = require("cheerio");
const Log = require("logger");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
    start: function() {
        Log.info("Starting node helper for: " + this.name);
        this.cacheFile = path.join(__dirname, ".honours-cache.json");
        this.cache = this._loadCache();
        this.debug = false;
        
        // Configure shared request manager
        requestManager.updateConfig({
            minRequestInterval: 2000,
            minDomainInterval: 1000,
            maxRetries: 3,
            requestTimeout: 10000
        });
    },

    // Socket notification received from module
    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_HONOURS") {
            this.debug = payload.debug || false;
            if (this.debug) {
                requestManager.enableDebug();
            }
            
            if (payload.useWikidata) {
                this.fetchWikidataHonours(payload.scrapeUrl, payload.team);
            } else {
                this.fetchHonours(payload.scrapeUrl, payload.team);
            }
        }
    },

    // Fetch honours data from Wikidata
    fetchWikidataHonours: function(url, team) {
        // CACHE-001: Check cache first
        const now = Date.now();
        const cached = this.cache[url + "_wikidata"];
        const maxAge = 23 * 60 * 60 * 1000; // 23 hours

        if (cached && (now - cached.timestamp < maxAge)) {
            if (this.debug) Log.info(`${this.name}: Serving cached Wikidata for ${team}`);
            this.sendSocketNotification("HONOURS_RESULT", {
                team: team,
                honours: cached.data.honours,
                totalHonours: cached.data.totalHonours,
                lastWonYears: cached.data.lastWonYears || {}
            });
            return;
        }

        if (this.debug) Log.info(`${this.name}: Fetching Wikidata honours for ${team}`);
        
        // Use the Wikipedia URL to extract the page title
        let pageTitle = "";
        try {
            const pathParts = new URL(url).pathname.split('/');
            pageTitle = pathParts[pathParts.length - 1];
        } catch (e) {
            Log.error(`${this.name}: Failed to extract page title from URL: ${url}`);
            this.fetchHonours(url, team); // Fallback to scraping
            return;
        }

        // 1. Get Wikidata QID for the Wikipedia page
        const wikiApiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&titles=${pageTitle}&format=json`;
        
        requestManager.queueRequest({
            url: wikiApiUrl,
            options: { method: 'GET' },
            moduleId: this.name,
            priority: 1
        })
        .then(result => {
            if (!result.success || !result.data || !result.data.query || !result.data.query.pages) {
                throw new Error("Failed to get Wikidata ID from Wikipedia API");
            }
            
            const pages = result.data.query.pages;
            const pageId = Object.keys(pages)[0];
            const qid = pages[pageId].pageprops?.wikibase_item;
            
            if (!qid) throw new Error("No Wikidata ID found for this page");
            
            if (this.debug) Log.info(`${this.name}: Found Wikidata QID ${qid} for ${team}`);
            
            // 2. Query Wikidata for honours
            const sparql = `
                SELECT ?award ?awardLabel ?count ?lastWon WHERE {
                  BIND(wd:${qid} AS ?team)
                  {
                    ?team p:P166 ?statement.
                    ?statement ps:P166 ?award.
                    OPTIONAL { ?statement pq:P1114 ?count. }
                    OPTIONAL { ?statement pq:P585 ?lastWon. }
                  } UNION {
                    ?award wdt:P1346 ?team. # ?award "winner" is ?team
                    BIND(1 AS ?count)
                    OPTIONAL { ?award wdt:P585 ?lastWon. }
                  }
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
                }
            `;
            
            const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
            
            return requestManager.queueRequest({
                url: wikidataUrl,
                options: { method: 'GET', headers: { 'Accept': 'application/sparql-results+json' } },
                moduleId: this.name,
                priority: 1
            });
        })
        .then(result => {
            if (!result.success || !result.data || !result.data.results) {
                throw new Error("Wikidata SPARQL query failed");
            }
            
            const bindings = result.data.results.bindings;
            const honours = {};
            let totalHonours = 0;
            const lastWonYears = {};

            bindings.forEach(binding => {
                const awardLabel = binding.awardLabel.value;
                const count = binding.count ? parseInt(binding.count.value) : 1;
                const lastWon = binding.lastWon ? binding.lastWon.value.split('-')[0] : null;

                // Map Wikidata award labels to our internal trophy types
                let mappedType = null;
                const label = awardLabel.toLowerCase();
                
                if (label.includes("scottish league") || label.includes("scottish premiership") || label.includes("scottish football league")) {
                    mappedType = "Scottish League/Premier League/Premiership";
                } else if (label.includes("scottish cup")) {
                    mappedType = "Scottish Cup";
                } else if (label.includes("scottish league cup")) {
                    mappedType = "Scottish League Cup";
                } else if (label.includes("european cup") || label.includes("uefa champions league")) {
                    mappedType = "European Cup/Champions League";
                }

                if (mappedType) {
                    honours[mappedType] = (honours[mappedType] || 0) + count;
                    totalHonours += count;
                    if (lastWon) {
                        if (!lastWonYears[mappedType] || lastWon > lastWonYears[mappedType]) {
                            lastWonYears[mappedType] = lastWon;
                        }
                    }
                }
            });

            // Fill in missing types
            const trophyTypes = [
                "Scottish League/Premier League/Premiership",
                "Scottish Cup",
                "Scottish League Cup",
                "European Cup/Champions League"
            ];
            trophyTypes.forEach(type => { if (!honours[type]) honours[type] = 0; });

            this.cache[url + "_wikidata"] = {
                data: {
                    honours: honours,
                    totalHonours: totalHonours,
                    lastWonYears: lastWonYears
                },
                timestamp: now
            };
            this._saveCache();

            this.sendSocketNotification("HONOURS_RESULT", {
                team: team,
                honours: honours,
                totalHonours: totalHonours,
                lastWonYears: lastWonYears
            });
        })
        .catch(error => {
            Log.warn(`${this.name}: Wikidata fetch failed for ${team}, falling back to scraping: ${error.message}`);
            this.fetchHonours(url, team);
        });
    },

    // Fetch honours data from the specified URL
    fetchHonours: function(url, team) {
        // SEC-003: URL Allowlist
        const ALLOWED_HOSTNAMES = ["en.wikipedia.org", "www.wikipedia.org", "query.wikidata.org"];
        try {
            const urlObj = new URL(url);
            if (!ALLOWED_HOSTNAMES.includes(urlObj.hostname)) {
                Log.error(`${this.name}: Hostname ${urlObj.hostname} is not permitted.`);
                this.sendSocketNotification("HONOURS_RESULT", {
                    error: "scrapeUrl hostname not permitted."
                });
                return;
            }
        } catch (e) {
            Log.error(`${this.name}: Invalid scrapeUrl provided: ${url}`);
            this.sendSocketNotification("HONOURS_RESULT", {
                error: "Invalid scrapeUrl provided."
            });
            return;
        }

        // CACHE-001: In-memory cache
        const now = Date.now();
        const cached = this.cache[url];
        const maxAge = 23 * 60 * 60 * 1000; // 23 hours

        if (cached && (now - cached.timestamp < maxAge)) {
            if (this.debug) Log.info(`${this.name}: Serving cached data for ${team}`);
            this.sendSocketNotification("HONOURS_RESULT", {
                team: team,
                honours: cached.data.honours,
                totalHonours: cached.data.totalHonours,
                lastWonYears: cached.data.lastWonYears || {}
            });
            return;
        }

        if (this.debug) Log.info(`${this.name}: Fetching honours data for ${team} from ${url}`);
        
        const headers = {
            'User-Agent': 'MagicMirror/MMM-MyTeams-Honours'
        };

        // CACHE-002: Conditional headers
        if (cached) {
            if (cached.etag) headers['If-None-Match'] = cached.etag;
            if (cached.lastModified) headers['If-Modified-Since'] = cached.lastModified;
        }

        requestManager.queueRequest({
            url: url,
            options: {
                method: 'GET',
                headers: headers
            },
            timeout: 10000,
            priority: 2,  // Low priority
            moduleId: 'MMM-MyTeams-Honours',
            deduplicate: true
        })
        .then((result) => {
            if (this.debug) Log.info(`${this.name}: Received response with status ${result.status}`);
            
            if (result.status === 304 && cached) {
                if (this.debug) Log.info(`${this.name}: Resource not modified, using cache for ${team}`);
                cached.timestamp = now;
                this.sendSocketNotification("HONOURS_RESULT", {
                    team: team,
                    honours: cached.data.honours,
                    totalHonours: cached.data.totalHonours,
                    lastWonYears: cached.data.lastWonYears || {}
                });
                return;
            }

            if (result.success) {
                const honours = this.parseHonoursData(result.data, team);
                
                if (honours.error) {
                    this.sendSocketNotification("HONOURS_RESULT", {
                        team: team,
                        error: honours.error
                    });
                } else {
                    // Update cache
                    this.cache[url] = {
                        data: honours,
                        timestamp: now,
                        etag: result.headers ? result.headers.etag : null,
                        lastModified: result.headers ? result.headers['last-modified'] : null
                    };
                    this._saveCache();
                    this.sendSocketNotification("HONOURS_RESULT", {
                        team: team,
                        honours: honours.honours,
                        totalHonours: honours.totalHonours,
                        lastWonYears: honours.lastWonYears || {}
                    });
                }
            } else {
                this.sendSocketNotification("HONOURS_RESULT", {
                    team: team,
                    error: `Failed to fetch data: ${result.status}`
                });
            }
        })
        .catch((error) => {
            Log.error(`${this.name}: Error fetching honours data: ${error.message}`);
            this.sendSocketNotification("HONOURS_RESULT", {
                error: `Error fetching data: ${error.message}`
            });
        });
    },

    // Parse the HTML to extract honours data
    parseHonoursData: function(html, team) {
        try {
            const $ = cheerio.load(html);
            const honours = {};
            let totalHonours = 0;
            const lastWonYears = {};
            
            // Helper: process one wikitable row into honours/lastWonYears
            const processRow = (row) => {
                const $row = $(row);
                if ($row.find('td').length === 0) return; // skip header-only rows
                const cells = $row.find('td, th');
                if (cells.length < 2) return;
                const competition = $(cells[0]).text().trim();
                const countText   = $(cells[1]).text().trim();
                const seasonsText = cells.length >= 3 ? $(cells[2]).text().trim() : "";
                const count = this.extractNumber(countText);
                if (count > 0) {
                    const mappedType = this.mapCompetitionToTrophyType(competition);
                    if (mappedType && !honours[mappedType]) {
                        honours[mappedType] = count;
                        totalHonours += count;
                        const years = (seasonsText + " " + countText).match(/\b(19|20)\d{2}\b/g);
                        if (years) lastWonYears[mappedType] = Math.max(...years.map(y => parseInt(y)));
                    }
                }
            };

            // Helper: true if $el is a level-2 section boundary (h2 or mw-heading2 div).
            // Wikipedia wraps headings in <div class="mw-heading mw-heading2"> in modern markup.
            const isMajorSection = ($el) => {
                if ($el.is('h2')) return true;
                if ($el.hasClass('mw-heading') && ($el.hasClass('mw-heading2') || !$el.hasClass('mw-heading3'))) return true;
                return false;
            };

            // Helper: walk prevAll siblings of a table; when the first major-section boundary is
            // found, return true if its text contains "honours".
            const isInHonoursSection = ($table) => {
                let found = false;
                $table.prevAll().each((j, el) => {
                    const $el = $(el);
                    if (isMajorSection($el)) {
                        found = $el.text().toLowerCase().includes('honours');
                        return false; // stop
                    }
                });
                return found;
            };

            // 1. Try wikitable-based parsing (primary path for major clubs).
            // NOTE: Celtic FC (and many clubs) have Honours sub-sections (h3 "Domestic",
            // h3 "European") so the closest preceding heading is NOT "Honours".  We
            // therefore walk back to the first major (h2-level) boundary instead.
            $('table.wikitable').each((i, table) => {
                if (isInHonoursSection($(table))) {
                    $(table).find('tr').each((j, row) => processRow(row));
                }
            });

            // 2. Broader fallback: any wikitable whose first column header looks like honours data
            if (totalHonours === 0) {
                if (this.debug) Log.info(`${this.name}: Honours section scan yielded 0 — trying broad wikitable scan`);
                $('table.wikitable').each((i, table) => {
                    const firstTh = $(table).find('tr th').first().text().toLowerCase();
                    if (firstTh.includes('competition') || firstTh.includes('league') ||
                        firstTh.includes('cup') || firstTh.includes('honours')) {
                        $(table).find('tr').each((j, row) => processRow(row));
                    }
                });
            }

            // 3. Fallback to list-based parsing
            if (totalHonours === 0) {
                if (this.debug) Log.info(`${this.name}: Table scan yielded 0 — trying list-based parsing`);
                let honoursSection = $([]);

                // Modern Wikipedia: <h2 id="Honours"> wrapped in <div class="mw-heading mw-heading2">
                const directH2 = $('h2[id="Honours"], h2[id="Club_honours"], h2[id="Major_honours"]');
                if (directH2.length > 0) {
                    honoursSection = directH2.parent().nextUntil('.mw-heading2, h2');
                }

                // Legacy Wikipedia: <span id="Honours"> inside <h2>
                if (honoursSection.length === 0) {
                    const anchor = $('#Honours, #Club_honours, #Major_honours');
                    if (anchor.length > 0) {
                        honoursSection = anchor.closest('h2').nextUntil('h2');
                    }
                }

                // Last resort: find by heading text
                if (honoursSection.length === 0) {
                    const heading = $('h2, h3').filter((i, el) => $(el).text().toLowerCase().includes('honours'));
                    if (heading.length > 0) honoursSection = heading.first().nextUntil('h2, h3');
                }

                honoursSection.each((i, elem) => {
                    const listItems = $(elem).is('ul') ? $(elem).find('li') : [elem];
                    $(listItems).each((j, item) => {
                        const text = $(item).text().trim();
                        if (!text) return;
                        const count = this.extractNumber(text);
                        const mappedType = this.mapCompetitionToTrophyType(text);
                        if (mappedType && !honours[mappedType]) {
                            const finalCount = (count === 0 && (text.includes('European Cup') || text.includes('Champions League'))) ? 1 : count;
                            if (finalCount > 0) {
                                honours[mappedType] = finalCount;
                                totalHonours += finalCount;
                                const years = text.match(/\b(19|20)\d{2}\b/g);
                                if (years) lastWonYears[mappedType] = Math.max(...years.map(y => parseInt(y)));
                            }
                        }
                    });
                });
            }
            
            // Ensure we have values for all trophy types
            const trophyTypes = [
                "Scottish League/Premier League/Premiership",
                "Scottish Cup",
                "Scottish League Cup",
                "European Cup/Champions League"
            ];
            
            trophyTypes.forEach(type => { if (!honours[type]) honours[type] = 0; });
            
            return {
                honours: honours,
                totalHonours: totalHonours,
                lastWonYears: lastWonYears
            };
        } catch (error) {
            Log.error(`${this.name}: Error parsing honours data: ${error.message}`);
            return { error: `Error parsing data: ${error.message}` };
        }
    },

    // Helper to map competition names to standard types
    mapCompetitionToTrophyType: function(text) {
        const t = text.toLowerCase();
        
        // League Cup must be checked BEFORE generic "league" to avoid false matches
        if (t.includes("league cup") || t.includes("coca-cola cup") || t.includes("cis cup") ||
            t.includes("bell's cup") || t.includes("drybrough cup") || t.includes("skol cup") ||
            t.includes("league cup")) {
            return "Scottish League Cup";
        }

        // European Cup / Champions League
        if (t.includes("european cup") || t.includes("champions league") ||
            t.includes("uefa champions league") || t.includes("european champion clubs")) {
            return "European Cup/Champions League";
        }

        // Scottish Cup (national knockout cup — must be checked before generic league check)
        if (t.includes("scottish cup") || t.includes("scottish fa cup")) {
            return "Scottish Cup";
        }
        // Catch "fa cup" variants where "scottish" might be absent in some table headings
        if (t.includes("cup") && t.includes("scottish") &&
            !t.includes("league cup") && !t.includes("challenge") && !t.includes("charity")) {
            return "Scottish Cup";
        }

        // Scottish League / Premiership
        if (t.includes("scottish football league") || t.includes("scottish premiership") ||
            t.includes("scottish premier league") || t.includes("scottish premier division") ||
            t.includes("scottish first division") || t.includes("scottish league championship")) {
            return "Scottish League/Premier League/Premiership";
        }
        // Broader league catch: any "league"/"premiership" with a Scottish indicator
        if ((t.includes("league") || t.includes("premiership")) &&
            (t.includes("scottish") || t.includes("scotland"))) {
            return "Scottish League/Premier League/Premiership";
        }

        return null;
    },
    
    // Helper function to extract numbers from text
    extractNumber: function(text) {
        // Match patterns like:
        // "(55)" -> 55
        // ": 55" -> 55
        // "55 times" -> 55
        // "55 titles" -> 55
        
        // 1. Look for number in parentheses
        const parenMatch = text.match(/\((\d+)\)/);
        if (parenMatch) return parseInt(parenMatch[1]);
        
        // 2. Look for number after a colon
        const colonMatch = text.match(/:\s*(\d+)/);
        if (colonMatch) return parseInt(colonMatch[1]);
        
        // 3. Look for "X times" or "X titles"
        const timesMatch = text.match(/(\d+)\s*(times|titles|wins|championships)/i);
        if (timesMatch) return parseInt(timesMatch[1]);
        
        // 4. Just find the first number that isn't a year
        const allNumbers = text.match(/\b\d+\b/g);
        if (allNumbers) {
            for (let num of allNumbers) {
                const n = parseInt(num);
                // Assume if it's > 1800 and < 2100 it might be a year
                if (n < 1800 || n > 2100) return n;
            }
        }
        
        return 0;
    },

    // CACHE-003: Load cache from file
    _loadCache: function() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                return JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
            }
        } catch (error) {
            Log.error(this.name + ": Error loading cache: " + error.message);
        }
        return {};
    },

    // CACHE-003: Save cache to file
    _saveCache: function() {
        try {
            fs.writeFileSync(this.cacheFile, JSON.stringify(this.cache), "utf8");
        } catch (error) {
            Log.error(this.name + ": Error saving cache: " + error.message);
        }
    }
});
