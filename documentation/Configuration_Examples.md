# Configuration Examples

This document provides several examples of how to configure the MMM-MyTeams-Honours module.

## Single Team (Default)
The simplest configuration, using the default Celtic FC honours:

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_left",
    config: {
        team: "Celtic FC",
        scrapeUrl: "https://en.wikipedia.org/wiki/Celtic_F.C.#Honours",
        showTotal: true
    }
}
```

## Multiple Teams with Rotation
You can configure several teams and have the module rotate through them. For clubs with complex histories (e.g., shared trophies or liquidation), you can enable an asterisk on the count:

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_right",
    config: {
        rotationInterval: 20 * 1000,
        teams: [
            {
                team: "Celtic FC",
                scrapeUrl: "https://en.wikipedia.org/wiki/Celtic_F.C.#Honours",
                accentColor: "#018749"
            },
            {
                team: "Liverpool FC",
                scrapeUrl: "https://en.wikipedia.org/wiki/Liverpool_F.C.#Honours",
                accentColor: "#C8102E", // Liverpool Red
                indicatePredecessor: true // Adds an asterisk to the trophy count
            }
        ]
    }
}
```

## Custom Colors and Sizing
Override the default aesthetics to match your MagicMirror theme:

```javascript
{
            module: "MMM-MyTeams-Honours",
            position: "top_left",
            config: {
                team: "Liverpool FC",
                scrapeUrl: "https://en.wikipedia.org/wiki/Liverpool_F.C.#Honours",
                accentColor: "#C8102E", // Liverpool Red
                trophySize: 80, // Larger trophies
                countColor: "#F6EB61", // Custom gold
                labelSize: "medium",
                countSize: "large",
                showTotal: true,
                 trophyMapping: {
                    "National League Cup": "EFL-Cup.png",
                    "National League": 	   "EPL.png",
                    "National Cup":        "English-FA-Cup.png",
                    "European Cup":        "european-cup.png",
                    "UEFA Cup":            "europa-league.png",
                    "Other":               "charity-shield.png"					
            },
        },
},
```

## Accessibility and Debugging
Enable detailed logging and ensure high contrast:

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "bottom_right",
    config: {
        team: "Manchester United",
        scrapeUrl: "https://en.wikipedia.org/wiki/Manchester_United_F.C.#Honours",
        debug: true, // Enable detailed logging
        fontColorOverride: "#FFFFFF", // Force white text for contrast
        opacityOverride: 1.0, // Disable transparency
        trophyMapping: {
                "National League Cup": "EFL-Cup.png",
                "National League": 	   "EPL.png",
                "National Cup":        "English-FA-Cup.png",
                "European Cup":        "european-cup.png",
                "UEFA Cup":            "europa-league.png",
                "Other":               "trophy.png"
        }

    }
}
```

## Custom Trophy Mapping
If your team has trophies that aren't in the default mapping:

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_right",
    config: {
        team: "Ajax",
        scrapeUrl: "https://en.wikipedia.org/wiki/AFC_Ajax#Honours",
        trophyMapping: {
            "Eredivisie": "dutch-league.png",
            "KNVB Cup": "dutch-cup.png",
            "UEFA Champions League": "european-cup.png",
            "Other": "trophy.png"
        }
    }
}
```

## Using Wikidata (Prototype)
*Experimental: This feature is currently in prototype.*

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_right",
    config: {
        team: "Celtic FC",
        useWikidata: true, // Query the Wikidata SPARQL API instead of scraping HTML
        showLastWon: true // Show the year of the most recent win
    }
}
```

## Full config option

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_right",
    config: {
        updateInterval: 24 * 60 * 60 * 1000, // update once per day
        rotationInterval: 20 * 1000, // rotation every 20 seconds if multiple teams
        retryDelay: 5000, // retry every 5 seconds on failure
        team: "Celtic FC", // default team
        scrapeUrl: "https://en.wikipedia.org/wiki/Celtic_F.C.#Honours", // default URL to scrape
        teams: [], // optional array of { team, scrapeUrl, accentColor, indicatePredecessor }
        maxRetries: 5, // maximum number of retries
        showTotal: true, // show total honours count
        animationSpeed: 1000, // fade animation speed in milliseconds
        trophySize: 64, // size of trophy images in pixels
        trophySpacing: 8, // spacing between trophies in pixels
        showLabels: true, // show trophy labels
        showLastWon: false, // show year of most recent win
        labelSize: "small", // size of labels (small, medium, large)
        showCount: true, // show count of each trophy
        countSize: "medium", // size of count (small, medium, large)
        countColor: "#FFD700", // gold color for count
        labelColor: "#FFFFFF", // white color for labels
        trophyMapping: {
            "National League":     "scottish-league.png",
            "National Cup":        "scottish-cup.png",
            "National League Cup": "league-cup.png",
            "European Cup":        "european-cup.png",
            "UEFA Cup":            "uefa-cup.png",
            "Other":               "trophy.png"
        },
        debug: false, // enable for console logging
        accentColor: "#018749", // default club accent color (Celtic green)
        useWikidata: false, // prototype: query Wikidata SPARQL API instead of scraping
        indicatePredecessor: false, // show asterisk for clubs with history continuity needs
        cacheTTL: 5 * 60 * 1000, // cache time-to-live in ms
        
        // Theme overrides
        darkMode: null,           // null=auto, true=force dark, false=force light
        fontColorOverride: null,  // e.g., "#FFFFFF" to force white text
        opacityOverride: null     // e.g., 1.0 to force full opacity
    }
}
```
