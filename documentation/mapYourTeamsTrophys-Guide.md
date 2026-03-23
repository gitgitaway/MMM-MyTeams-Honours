# Mapping Your Team's Trophies

This guide explains how to customize the trophy images displayed for your specific club.

## Canonical Trophy Types

The module uses 6 universal "Canonical Keys" to identify trophies across all leagues and countries. When you provide a `trophyMapping` in your `config.js`, you must use these keys:

1.  **`National League`**: Top-flight league titles (e.g., Premier League, La Liga, Scottish Premiership).
2.  **`National Cup`**: The primary national cup competition (e.g., FA Cup, Scottish Cup, Copa del Rey).
3.  **`National League Cup`**: Secondary league cups (e.g., EFL Cup/Carabao Cup, Scottish League Cup).
4.  **`European Cup`**: Top-tier European competitions (UEFA Champions League / European Cup).
5.  **`UEFA Cup`**: Secondary European competitions (UEFA Europa League / UEFA Cup / Cup Winners' Cup).
6.  **`Other`**: A catch-all for other major trophies (e.g., Charity/Community Shield, Super Cups).

## How to Add Custom Images

If you want to use club-specific trophy images (e.g., the actual English Premier League trophy instead of a generic one):

1.  **Find Your Image**: 
    - Most high-quality trophy images can be found on sites like **[TheSportsDB.com](https://www.thesportsdb.com/)**.
    - Search for the league or competition. 
    - Scroll to the bottom of the competition page to find the "Trophy" image.
2.  **Download and Rename**:
    - Download the image (preferably a transparent PNG).
    - Move it to your MagicMirror's `modules/MMM-MyTeams-Honours/trophyImages/` folder.
3.  **Update Your Config**:
    - Add a `trophyMapping` object to your module configuration in `config/config.js`.

### Example: Liverpool FC Configuration

```javascript
{
    module: "MMM-MyTeams-Honours",
    position: "top_right",
    config: {
        team: "Liverpool FC",
        scrapeUrl: "https://en.wikipedia.org/wiki/Liverpool_F.C.#Honours",
        accentColor: "#C8102E",
        trophyMapping: {
            "National League":     "EPL-trophy.png",
            "National Cup":        "English-FA-Cup.png",
            "National League Cup": "Carabao-Cup.png",
            "European Cup":        "Champions-League.png",
            "UEFA Cup":            "Europa-League.png",
            "Other":               "Club-World-Cup.png"
        }
    }
}
```

## Tips for Best Results
- **Transparency**: Use PNGs with transparent backgrounds so they look good on any MagicMirror background.
- **Size**: The module automatically scales images to the `trophySize` defined in your config (default is 64px), but starting with a source image around 200px-500px ensures high quality.
- **File Names**: Remember that Linux (Raspberry Pi) file systems are case-sensitive. `Trophy.png` is not the same as `trophy.png`.
