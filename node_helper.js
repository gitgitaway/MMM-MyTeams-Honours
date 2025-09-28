/* Magic Mirror
 * Node Helper: MMM-MyTeams-Honours
 *
 * By JC's Celtic Man Cave
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const axios = require("axios");
const cheerio = require("cheerio");
const Log = require("logger");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
        this.fetchedData = {};
    },

    // Socket notification received from module
    socketNotificationReceived: function(notification, payload) {
        if (notification === "GET_HONOURS") {
            this.fetchHonours(payload.scrapeUrl, payload.team);
        }
    },

    // Fetch honours data from the specified URL
    fetchHonours: function(url, team) {
        console.log(`${this.name}: Fetching honours data for ${team} from ${url}`);
        
        axios.get(url)
            .then((response) => {
                if (response.status === 200) {
                    const honours = this.parseHonoursData(response.data, team);
                    this.sendSocketNotification("HONOURS_RESULT", honours);
                } else {
                    this.sendSocketNotification("HONOURS_RESULT", {
                        error: `Failed to fetch data: ${response.status}`
                    });
                }
            })
            .catch((error) => {
                console.error(`${this.name}: Error fetching honours data:`, error);
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
            
            // Find the Honours section
            const honoursSection = $('span#Honours').parent().nextUntil('h2');
            
            // Default honours for Celtic FC
            if (team === "Celtic FC") {
                honours["Scottish League/Premier League/Premiership"] = 55;
                honours["Scottish Cup"] = 42;
                honours["Scottish League Cup"] = 22;
                honours["European Cup/Champions League"] = 1;
                totalHonours = 120; // Total major honours
            } else {
                // For other teams, try to parse from the page
                // This is a simplified example - actual parsing would be more complex
                honoursSection.each((i, elem) => {
                    const text = $(elem).text();
                    
                    // Look for patterns like "Scottish League Championship: 55 times"
                    if (text.includes("League") && text.includes("times")) {
                        honours["Scottish League/Premier League/Premiership"] = this.extractNumber(text);
                        totalHonours += honours["Scottish League/Premier League/Premiership"];
                    }
                    
                    if (text.includes("Scottish Cup") && text.includes("times")) {
                        honours["Scottish Cup"] = this.extractNumber(text);
                        totalHonours += honours["Scottish Cup"];
                    }
                    
                    if (text.includes("League Cup") && text.includes("times")) {
                        honours["Scottish League Cup"] = this.extractNumber(text);
                        totalHonours += honours["Scottish League Cup"];
                    }
                    
                    if (text.includes("European Cup") || text.includes("Champions League")) {
                        honours["European Cup/Champions League"] = this.extractNumber(text);
                        totalHonours += honours["European Cup/Champions League"];
                    }
                });
            }
            
            // Ensure we have values for all trophy types
            const trophyTypes = [
                "Scottish League/Premier League/Premiership",
                "Scottish Cup",
                "Scottish League Cup",
                "European Cup/Champions League"
            ];
            
            trophyTypes.forEach(type => {
                if (!honours[type]) {
                    honours[type] = 0;
                }
            });
            
            return {
                honours: honours,
                totalHonours: totalHonours
            };
        } catch (error) {
            console.error(`${this.name}: Error parsing honours data:`, error);
            return {
                error: `Error parsing data: ${error.message}`
            };
        }
    },
    
    // Helper function to extract numbers from text
    extractNumber: function(text) {
        const matches = text.match(/\d+/);
        return matches ? parseInt(matches[0]) : 0;
    }
});
