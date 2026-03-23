# Troubleshooting Guide

This document helps you resolve common issues with the MMM-MyTeams-Honours module.

## Common Issues and Solutions

### 1. "Loading honours data..." is Stuck
If the module never transitions from the loading state:
- **Check Your Internet Connection**: Ensure your MagicMirror has access to the internet.
- **Verify `scrapeUrl`**: Open the URL in your browser to confirm it is reachable.
- **Check the Console Logs**: Set `debug: true` in your config and check the MagicMirror logs (or run `npm start dev`) for any errors from the node helper.

### 2. "Unable to load honours data. Retrying..."
This error indicates a network or parsing failure:
- **Rate Limiting**: Wikipedia or your scraping target might be rate-limiting your IP. The `SharedRequestManager` handles this automatically with retries, but if it persists, check your `updateInterval`.
- **Invalid URL Hostname**: For security, only specific hostnames are allowed (e.g., `en.wikipedia.org`). If you're using a custom source, verify it is in the permitted list.
- **Wikipedia Page Changes**: Wikipedia occasionally updates its page structure. If the "Honours" section has moved or been renamed, the scraper may fail to find data.

### 3. Trophies are Displayed but Counts are "0"
If the module loads but doesn't find any trophy counts:
- **Verify HTML Parsing**: Wikipedia uses different section IDs for different clubs. The default is `span#Honours`. If your club's page uses a different ID, the current scraper may need customization.
- **Team Name Match**: Ensure the `team` name in your config matches the text on the Wikipedia page if the scraper relies on it.

### 4. Layout is Misaligned or Cut Off
If the module looks strange on your display:
- **Font Size**: The module uses `font-size: 0.8em` for base scaling. You can adjust this in your custom CSS or using the `labelSize` and `countSize` options.
- **Flex Wrap**: Trophies are designed to wrap to multiple lines on smaller screens. If they are overlapping, check your `trophySize` setting.

### 5. Custom Trophy Images are Missing
If you see a generic trophy icon instead of your custom image:
- **File Name Match**: Check that the image file name in `trophyImages/` matches the mapping in your `trophyMapping` configuration.
- **File Case Sensitivity**: Linux-based systems (like Raspberry Pi OS) are case-sensitive. `League.png` is not the same as `league.png`.

### 6. Asterisk (*) on Trophy Counts
If you see an asterisk next to a trophy count:
- **Shared Trophies**: The module automatically detects if a trophy was shared with another club (e.g., Charity Shield) and adds an asterisk.
- **Predecessor History**: If `indicatePredecessor: true` is set for a team, an asterisk is shown to indicate that the count includes trophies won by a previous legal entity or predecessor club (common for clubs that underwent liquidation).
- **Aria Context**: Screen readers will announce "(includes shared or predecessor titles)" when an asterisk is present.

### 7. Missing Trophy Categories (e.g., League vs. Cup)
If some trophies aren't showing up:
- **Canonical Mapping**: Ensure your `trophyMapping` uses the 6 canonical keys: `National League`, `National Cup`, `National League Cup`, `European Cup`, `UEFA Cup`, and `Other`.
- **Parser Detection**: Wikipedia tables for some clubs have 4 columns (`Type | Competition | Titles | Seasons`) instead of 3. The module now handles this automatically, but if a new layout appears, it may require a parser update.

## Enabling Debug Mode

To get detailed information about what's happening under the hood:
1. In your `config.js`, set `debug: true` inside the module's `config` object.
2. Restart MagicMirror.
3. Check the logs:
   - **Frontend logs**: Press `Ctrl+Shift+I` in the MagicMirror browser window and look at the "Console" tab.
   - **Backend logs**: Check the terminal where you started MagicMirror (or `pm2 logs`).

## Reporting a Bug
If you've tried everything above and still have issues:
1. Open an issue on the [GitHub repository](https://github.com/gitgitaway/MMM-MyTeams-Honours/issues).
2. Include your configuration (remove any sensitive information).
3. Provide the debug logs from both the frontend and backend.
4. Mention the team and `scrapeUrl` you are using.
