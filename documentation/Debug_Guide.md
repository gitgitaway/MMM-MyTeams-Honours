# Debugging Guide

This document explains how to use the debugging features of the MMM-MyTeams-Honours module.

## Enabling Debug Mode

To enable detailed logging for both the frontend and backend:
1. In your `config.js`, set `debug: true` inside the module's `config` object.
2. Restart MagicMirror.

## Frontend Debugging (Browser)

When `debug: true` is set, the module will log its internal state to the browser console.
- **Log Source**: Look for the module name `MMM-MyTeams-Honours` in the console.
- **Key Events**:
  - `Updating honours data`: Triggered at the start of a fetch cycle.
  - `Honours data updated`: Logs the raw honours object received from the node helper.
- **How to access**:
  - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (Mac) in the MagicMirror browser window.
  - Select the **Console** tab.

### Contrast Warnings
If you've enabled `fontColorOverride`, the module will perform a basic luminance check and log a warning if your chosen color might be hard to read against a dark background.

## Backend Debugging (Node Helper)

The node helper handles scraping and caching. When `debug` is enabled, it logs its activity to the MagicMirror server logs.
- **SharedRequestManager**: You will see the full lifecycle of every network request, including queuing, throttling, and retries.
- **Scraping Logs**: Shows the URL being fetched and the results of the `cheerio` parsing.
- **Cache Activity**: Indicates whether data was served from memory, the file cache, or a fresh fetch.
- **How to access**:
  - Check the terminal where you are running MagicMirror.
  - If using `pm2`, run `pm2 logs`.

## SharedRequestManager Debugging

The `SharedRequestManager` is a critical component that coordinates all module requests.
- **Rate Limiting**: It will log when it throttles a request to prevent domain overload.
- **Retries**: It will show when a fetch fails and how it implements exponential backoff for retries.
- **Deduplication**: It will log when it detects and skips a duplicate simultaneous request.

## Common Log Messages

- `[SharedRequestManager] Global throttle: waiting ...ms`: The global request limit was reached.
- `[SharedRequestManager] Domain throttle (en.wikipedia.org): waiting ...ms`: The per-domain request limit was reached.
- `[MMM-MyTeams-Honours]: Serving cached data for ...`: Data was served from the in-memory cache.
- `[MMM-MyTeams-Honours]: Resource not modified, using cache for ...`: A 304 HTTP response was received.
- `[MMM-MyTeams-Honours]: Scraping data for ... (no longer using hardcoded bypass)`: Confirms that the Celtic FC hardcode was skipped and the live site was scraped.
