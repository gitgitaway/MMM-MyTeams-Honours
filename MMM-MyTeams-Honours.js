/* Magic Mirror
 * Module: MMM-MyTeams-Honours
 * 
 * By JC's Celtic Man Cave
 * MIT Licensed.
 */

Module.register("MMM-MyTeams-Honours", {
    // Default module config
    defaults: {
        updateInterval: 24 * 60 * 60 * 1000, // update once per day
        retryDelay: 5000, // retry every 5 seconds on failure
        team: "Celtic FC", // default team
        scrapeUrl: "https://en.wikipedia.org/wiki/Celtic_F.C.#Honours", // default URL to scrape
        maxRetries: 5, // maximum number of retries
        showTotal: true, // show total honours count
        animationSpeed: 1000, // fade animation speed in milliseconds
        trophySize: 64, // size of trophy images in pixels (60% bigger than half size)
        trophySpacing: 8, // spacing between trophies in pixels
        showLabels: true, // show trophy labels
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
        debug: false // enable for console logging
    },

    // Define required scripts
    getScripts: function() {
        return ["moment.js"];
    },

    // Define required styles
    getStyles: function() {
        return ["MMM-MyTeams-Honours.css"];
    },

    // Define start sequence
    start: function() {
        Log.info("Starting module: " + this.name);
        this.honours = {};
        this.loaded = false;
        this.retryCount = 0;
        
        // Schedule first update
        this.scheduleUpdate();
    },

    // Override dom generator
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "mmm-myteams-honours";

        // Display loading message if data not loaded yet
        if (!this.loaded) {
            wrapper.innerHTML = "Loading honours data...";
            wrapper.className = "dimmed light small";
            // Apply 80% size styling to loading message
            wrapper.style.fontSize = "0.8em";
            return wrapper;
        }

        // Create header with team name
        const header = document.createElement("div");
        header.className = "honours-header";
        header.innerHTML = this.config.team + " Honours";
        wrapper.appendChild(header);

        // Create container for trophies
        const trophyContainer = document.createElement("div");
        trophyContainer.className = "trophy-container";

        // Add each trophy type
        Object.keys(this.honours).forEach(trophyType => {
            if (this.honours[trophyType] > 0) {
                const trophyDiv = document.createElement("div");
                trophyDiv.className = "trophy-item";
                
                // Trophy image
                const trophyImg = document.createElement("img");
                trophyImg.src = this.file("trophyImages/" + this.getTrophyImage(trophyType));
                trophyImg.width = this.config.trophySize;
                trophyImg.height = this.config.trophySize;
                trophyImg.alt = trophyType;
                trophyDiv.appendChild(trophyImg);
                
                // Trophy count
                if (this.config.showCount) {
                    const countDiv = document.createElement("div");
                    countDiv.className = "trophy-count " + this.config.countSize;
                    countDiv.style.color = this.config.countColor;
                    countDiv.innerHTML = "×" + this.honours[trophyType];
                    trophyDiv.appendChild(countDiv);
                }
                
                // Trophy label
                if (this.config.showLabels) {
                    const labelDiv = document.createElement("div");
                    labelDiv.className = "trophy-label " + this.config.labelSize;
                    labelDiv.style.color = this.config.labelColor;
                    labelDiv.innerHTML = this.getShortTrophyName(trophyType);
                    trophyDiv.appendChild(labelDiv);
                }
                
                trophyContainer.appendChild(trophyDiv);
            }
        });
        
        wrapper.appendChild(trophyContainer);
        
        // Add total honours count if enabled
        if (this.config.showTotal && this.totalHonours) {
            const totalDiv = document.createElement("div");
            totalDiv.className = "total-honours";
            totalDiv.innerHTML = "Total Major Honours: " + this.totalHonours;
            wrapper.appendChild(totalDiv);
        }

        return wrapper;
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
        if (trophyType.includes("Scottish League") || trophyType.includes("Premier League")) {
            return "League";
        } else if (trophyType.includes("Scottish Cup")) {
            return "Scottish Cup";
        } else if (trophyType.includes("League Cup")) {
            return "League Cup";
        } else if (trophyType.includes("European Cup") || trophyType.includes("Champions League")) {
            return "European Cup";
        }
        return trophyType;
    },

    // Schedule next update
    scheduleUpdate: function() {
        const self = this;
        setInterval(function() {
            self.updateHonours();
        }, this.config.updateInterval);
        
        // First update immediately
        this.updateHonours();
    },

    // Update honours data
    updateHonours: function() {
        if (this.config.debug) {
            Log.info(this.name + ": Updating honours data");
        }
        
        this.sendSocketNotification("GET_HONOURS", {
            scrapeUrl: this.config.scrapeUrl,
            team: this.config.team
        });
    },

    // Socket notification received
    socketNotificationReceived: function(notification, payload) {
        if (notification === "HONOURS_RESULT") {
            if (payload.error) {
                Log.error(this.name + ": " + payload.error);
                this.retryCount++;
                
                if (this.retryCount <= this.config.maxRetries) {
                    const self = this;
                    setTimeout(function() {
                        self.updateHonours();
                    }, this.config.retryDelay);
                }
                return;
            }
            
            this.honours = payload.honours;
            this.totalHonours = payload.totalHonours;
            this.loaded = true;
            this.retryCount = 0;
            
            if (this.config.debug) {
                Log.info(this.name + ": Honours data updated", this.honours);
            }
            
            this.updateDom(this.config.animationSpeed);
        }
    }
});
