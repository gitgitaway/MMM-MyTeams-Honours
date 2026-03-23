/* MagicMirror²
 * Module: MMM-MyTeams-Honours
 * 
 * By JC's Celtic Man Cave
 * MIT Licensed.
 */

Module.register("MMM-MyTeams-Honours", {
    // Default module config
    defaults: {
        updateInterval: 24 * 60 * 60 * 1000, // update once per day
        rotationInterval: 20 * 1000, // rotation every 20 seconds if multiple teams
        retryDelay: 5000, // retry every 5 seconds on failure
        team: "Celtic FC", // default team (can be array of strings or objects)
        scrapeUrl: "https://en.wikipedia.org/wiki/Celtic_F.C.#Honours", // default URL to scrape
        teams: [], // optional array of { team, scrapeUrl }
        maxRetries: 5, // maximum number of retries
        showTotal: true, // show total honours count
        animationSpeed: 1000, // fade animation speed in milliseconds
        trophySize: 64, // size of trophy images in pixels (60% bigger than half size)
        trophySpacing: 8, // spacing between trophies in pixels
        showLabels: true, // show trophy labels
        showLastWon: false, // show year of most recent win (requires Wikidata)
        labelSize: "small", // size of labels (small, medium, large)
        showCount: true, // show count of each trophy
        countSize: "medium", // size of count (small, medium, large)
        countColor: "#FFD700", // gold color for count
        labelColor: "#FFFFFF", // white color for labels
        trophyMapping: { // mapping of trophy names to image files
            "Scottish League/Premier League/Premiership": "league.png",
            "Scottish Cup": "scottish-cup.png",
            "Scottish League Cup": "league-cup.png",
            "European Cup/Champions League": "european-cup.png",
            "Other": "trophy.png"
        },
        debug: false, // enable for console logging
        accentColor: "#018749", // default club accent color (Celtic green)
        useWikidata: false, // prototype: query Wikidata SPARQL API instead of scraping
        
        // Theme overrides
        darkMode: null,           // null=auto, true=force dark, false=force light
        fontColorOverride: null,  // e.g., "#FFFFFF" to force white text
        opacityOverride: null     // e.g., 1.0 to force full opacity
    },

    // Define required scripts
    getScripts: function() {
        return [];
    },

    // Define required styles
    getStyles: function() {
        return ["MMM-MyTeams-Honours.css", "font-awesome.css"];
    },

    // Define translations
    getTranslations: function() {
        return {
            en: "translations/en.json",
            ga: "translations/ga.json",
            gd: "translations/gd.json",
            fr: "translations/fr.json",
            de: "translations/de.json",
            es: "translations/es.json",
            it: "translations/it.json",
            nl: "translations/nl.json"
        };
    },

    // Define start sequence
    start: function() {
        Log.info("Starting module: " + this.name);
        this.allHonours = {}; // Stores honours per team: { teamName: { honours, totalHonours, loaded } }
        this.teamList = this._getTeamList();
        this.currentTeamIndex = 0;
        this.error = null;
        this.updateTimer = null;
        this.rotationTimer = null;
        
        // Apply theme overrides once
        this._applyThemeOverrides();
        
        // Schedule first update
        this.scheduleUpdate();
        
        // Schedule rotation if multiple teams
        if (this.teamList.length > 1) {
            this.scheduleRotation();
        }
    },

    // Get list of teams to fetch
    _getTeamList: function() {
        if (this.config.teams && this.config.teams.length > 0) {
            return this.config.teams;
        }
        // Fallback to single team config
        return [{ team: this.config.team, scrapeUrl: this.config.scrapeUrl }];
    },

    // Override dom generator
    getDom: function() {
        const currentTeam = this.teamList[this.currentTeamIndex];
        const teamData = this.allHonours[currentTeam.team] || { loaded: false, honours: {} };

        const wrapper = document.createElement("section");
        wrapper.className = "mmm-myteams-honours";
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", currentTeam.team + " " + this.translate("HONOURS"));
        
        // Set accent color if provided
        const accentColor = currentTeam.accentColor || this.config.accentColor;
        if (accentColor) {
            wrapper.style.setProperty("--honours-accent", accentColor);
        }

        // A11Y-004: Debug-mode contrast warning
        if (this.config.debug && this.config.fontColorOverride) {
            this._checkContrast(this.config.fontColorOverride);
        }

        // Display error message if it exists
        if (this.error && !teamData.loaded) {
            wrapper.textContent = this.translate("UNABLE_TO_LOAD") + " " + currentTeam.team + ". " + this.translate("RETRYING");
            wrapper.className = "dimmed light small";
            wrapper.setAttribute("role", "alert");
            return wrapper;
        }

        // Display loading message if data not loaded yet
        if (!teamData.loaded) {
            wrapper.textContent = this.translate("LOADING") + " " + currentTeam.team + " " + this.translate("HONOURS_DATA");
            wrapper.className = "dimmed light small";
            wrapper.setAttribute("role", "status");
            wrapper.setAttribute("aria-live", "polite");
            
            // Add spinner
            const spinner = document.createElement("i");
            spinner.className = "fas fa-trophy fa-spin";
            spinner.style.marginLeft = "10px";
            wrapper.appendChild(spinner);
            
            return wrapper;
        }

        // Create header with team name
        const header = document.createElement("h2");
        header.className = "honours-header";
        header.textContent = currentTeam.team + " " + this.translate("HONOURS");
        wrapper.appendChild(header);

        // Display message if no honours found
        if (teamData.totalHonours === 0) {
            const noData = document.createElement("div");
            noData.className = "dimmed light small";
            noData.textContent = "No major honours found for " + currentTeam.team;
            wrapper.appendChild(noData);
            return wrapper;
        }

        // Create container for trophies
        const trophyContainer = document.createElement("div");
        trophyContainer.className = "trophy-container";

        // Add each trophy type
        Object.keys(teamData.honours).forEach(trophyType => {
            if (teamData.honours[trophyType] > 0) {
                const trophyDiv = document.createElement("figure");
                trophyDiv.className = "trophy-item";
                trophyDiv.dataset.category = this.getTrophyCategory(trophyType);
                
                // Trophy image
                const trophyImg = document.createElement("img");
                trophyImg.src = this.file("trophyImages/" + this.getTrophyImage(trophyType));
                trophyImg.width = this.config.trophySize;
                trophyImg.height = this.config.trophySize;
                trophyImg.alt = trophyType;
                trophyImg.loading = "lazy";
                trophyImg.decoding = "async";
                trophyDiv.appendChild(trophyImg);
                
                // Trophy count
                if (this.config.showCount) {
                    const countDiv = document.createElement("div");
                    countDiv.className = "trophy-count " + this.config.countSize;
                    countDiv.style.color = this.config.countColor;
                    countDiv.textContent = "×" + teamData.honours[trophyType];
                    countDiv.setAttribute("aria-label", teamData.honours[trophyType] + " " + this.translate("TITLES_WON"));
                    trophyDiv.appendChild(countDiv);
                }
                
                // Trophy label
                if (this.config.showLabels) {
                    const labelDiv = document.createElement("figcaption");
                    labelDiv.className = "trophy-label " + this.config.labelSize;
                    labelDiv.style.color = this.config.labelColor;
                    
                    let labelText = this.getShortTrophyName(trophyType);
                    if (this.config.showLastWon && teamData.lastWonYears && teamData.lastWonYears[trophyType]) {
                        labelText += ` (${teamData.lastWonYears[trophyType]})`;
                    }
                    labelDiv.textContent = labelText;
                    trophyDiv.appendChild(labelDiv);
                }
                
                // Screen reader context
                const sr = document.createElement("span");
                sr.className = "sr-only";
                sr.textContent = trophyType + ": " + teamData.honours[trophyType] + " " + this.translate("TITLES");
                trophyDiv.appendChild(sr);
                
                trophyContainer.appendChild(trophyDiv);
            }
        });
        
        wrapper.appendChild(trophyContainer);
        
        // Add total honours count if enabled
        if (this.config.showTotal && teamData.totalHonours) {
            const totalDiv = document.createElement("div");
            totalDiv.className = "total-honours";
            totalDiv.textContent = this.translate("TOTAL_MAJOR_HONOURS") + ": " + teamData.totalHonours;
            wrapper.appendChild(totalDiv);
        }

        return wrapper;
    },

    // Get trophy category for styling
    getTrophyCategory: function(trophyType) {
        const type = trophyType.toLowerCase();
        if (type.includes("league") || type.includes("premiership")) return "league";
        if (type.includes("european cup") || type.includes("champions league")) return "european";
        if (type.includes("cup")) return "cup";
        return "other";
    },

    // A11Y-004: Helper to check contrast (simplified)
    _checkContrast: function(color) {
        // Very basic check for light colors on dark backgrounds
        const c = color.substring(1);      // strip #
        const rgb = parseInt(c, 16);   // convert rrggbb to decimal
        const r = (rgb >> 16) & 0xff;  // extract red
        const g = (rgb >> 8) & 0xff;  // extract green
        const b = (rgb >> 0) & 0xff;  // extract blue
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
        if (luma > 160) {
            Log.warn(this.name + ": fontColorOverride (" + color + ") has high luminance (" + luma.toFixed(1) + "). Ensure it is legible against your MagicMirror background.");
        }
    },

    // Get trophy image filename from mapping or default
    getTrophyImage: function(trophyType) {
        for (const key in this.config.trophyMapping) {
            if (trophyType.includes(key)) {
                return this.config.trophyMapping[key];
            }
        }
        return this.config.trophyMapping["Other"];
    },
    
    // Get shortened trophy name for display
    getShortTrophyName: function(trophyType) {
        // Shorten long trophy names for display
        // Check for League Cup FIRST before checking for Scottish League (order matters!)
        if (trophyType.includes("League Cup") || trophyType.includes("Scottish League Cup")) {
            return this.translate("LEAGUE_CUP");
        } else if (trophyType.includes("Scottish League") || trophyType.includes("Premier League")) {
            return this.translate("LEAGUE");
        } else if (trophyType.includes("Scottish Cup")) {
            return this.translate("SCOTTISH_CUP");
        } else if (trophyType.includes("European Cup") || trophyType.includes("Champions League")) {
            return this.translate("EUROPEAN_CUP");
        }
        return trophyType;
    },

    // Schedule next update
    scheduleUpdate: function() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.updateTimer = setInterval(() => {
            this.updateHonours();
        }, this.config.updateInterval);
        
        // First update immediately
        this.updateHonours();
    },

    // Schedule team rotation
    scheduleRotation: function() {
        if (this.rotationTimer) clearInterval(this.rotationTimer);
        this.rotationTimer = setInterval(() => {
            this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teamList.length;
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotationInterval);
    },

    // Suspend module (stop timers)
    suspend: function() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        if (this.rotationTimer) clearInterval(this.rotationTimer);
        this.updateTimer = null;
        this.rotationTimer = null;
    },

    // Resume module (restart timers)
    resume: function() {
        this.scheduleUpdate();
        if (this.teamList.length > 1) {
            this.scheduleRotation();
        }
    },

    // Update honours data for all teams
    updateHonours: function() {
        this.teamList.forEach(teamEntry => {
            if (this.config.debug) {
                Log.info(this.name + ": Updating honours data for " + teamEntry.team);
            }
            
            this.sendSocketNotification("GET_HONOURS", {
                scrapeUrl: teamEntry.scrapeUrl,
                team: teamEntry.team,
                debug: this.config.debug,
                useWikidata: this.config.useWikidata,
                showLastWon: this.config.showLastWon
            });
        });
    },

    // Socket notification received
    socketNotificationReceived: function(notification, payload) {
        if (notification === "HONOURS_RESULT") {
            const teamName = payload.team;
            if (payload.error) {
                Log.error(this.name + " (" + teamName + "): " + payload.error);
                this.error = payload.error;
                // Retry is handled per team in start/update loop if we wanted, 
                // but simpler to just wait for next update cycle or manual refresh
                this.updateDom(this.config.animationSpeed);
                return;
            }
            
            this.allHonours[teamName] = {
                honours: payload.honours,
                totalHonours: payload.totalHonours,
                lastWonYears: payload.lastWonYears || {},
                loaded: true
            };
            this.error = null;
            
            if (this.config.debug) {
                Log.info(this.name + ": Honours data updated for " + teamName, payload.honours);
            }
            
            this.updateDom(this.config.animationSpeed);
        }
    },

    // -----------------------------
    // Theme Overrides
    // -----------------------------
    _applyThemeOverrides: function() {
        const styleId = "mmm-myteams-honours-theme-override";
        let styleEl = document.getElementById(styleId);
        
        // Remove existing style element if no overrides are active
        if (this.config.darkMode === null && 
            this.config.fontColorOverride === null && 
            this.config.opacityOverride === null) {
            if (styleEl) styleEl.remove();
            return;
        }
        
        // Create style element if it doesn't exist
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        
        // Build CSS rules
        let css = "";
        const isValidColor = (c) => /^(#[0-9A-Fa-f]{3,8}|rgba?\([\d,.\s]+\)|[a-zA-Z]+)$/.test(c);
        
        // Dark/Light mode override
        if (this.config.darkMode === true) {
            css += `.mmm-myteams-honours { background-color: #111 !important; color: #fff !important; }\n`;
        } else if (this.config.darkMode === false) {
            css += `.mmm-myteams-honours { background-color: #f5f5f5 !important; color: #000 !important; }\n`;
        }
        
        // Font color override
        if (this.config.fontColorOverride && isValidColor(this.config.fontColorOverride)) {
            css += `.mmm-myteams-honours * { color: ${this.config.fontColorOverride} !important; }\n`;
        }
        
        // Opacity override
        if (this.config.opacityOverride !== null && this.config.opacityOverride !== undefined) {
            const opacity = parseFloat(this.config.opacityOverride);
            if (!isNaN(opacity)) {
                css += `.mmm-myteams-honours * { opacity: ${opacity} !important; }\n`;
            }
        }
        
        styleEl.textContent = css;
    }

});
