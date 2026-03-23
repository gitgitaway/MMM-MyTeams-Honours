# How MMM-MyTeams-Honours Works

This document provides a technical overview of the module's architecture and data flow.

## Architecture Overview

The module follows the standard MagicMirror² architecture, consisting of a frontend module (`MMM-MyTeams-Honours.js`) and a backend node helper (`node_helper.js`).

### 1. Frontend (MMM-MyTeams-Honours.js)
- **State Management**: Tracks loading states, honours data for multiple teams, and error states.
- **DOM Generation**: Uses semantic HTML (`<section>`, `<h2>`, `<figure>`) to render the UI.
- **Theme System**: Applies CSS custom properties (`--honours-accent`) and supports dark/light mode overrides.
- **Rotation Engine**: If multiple teams are configured, it cycles through them based on `rotationInterval`.
- **Communication**: Sends `GET_HONOURS` socket notifications to the node helper.

### 2. Backend (node_helper.js)
- **Request Coordination**: Uses the `SharedRequestManager` singleton to queue and throttle HTTP requests.
- **Scraping Engine**: Uses `cheerio` to parse Wikipedia HTML and extract honours counts using a universal 4-column detection strategy.
- **Asterisk Detection**: Automatically detects "shared" trophies by scanning row text for specific keywords.
- **Season Normalization**: Normalizes season ranges (e.g., "1966–67") and extracts the effective end year for "Last Won" accuracy.
- **Caching Layer**: Implements both in-memory and file-based persistent caching (`.honours-cache.json`).
- **Conditional Requests**: Supports `ETag` and `Last-Modified` headers to perform efficient "304 Not Modified" checks.

## Data Flow Lifecycle

1. **Initialization**: On `start()`, the module loads its configuration and notifies the node helper.
2. **Initial Render**: The module check its local state. If data is missing, it displays a loading spinner.
3. **Data Request**: The frontend sends a `GET_HONOURS` notification for each configured team.
4. **Cache Check**: The node helper checks its in-memory cache. If valid and not expired, it returns data immediately.
5. **Persistent Cache**: If not in memory, it attempts to load from `.honours-cache.json`.
6. **Network Fetch**: If cache is missing or expired, it queues a request via `SharedRequestManager`.
7. **HTTP Conditional Check**: If a cached version exists, it sends `If-None-Match` or `If-Modified-Since` headers.
8. **Parsing**: Upon receiving a 200 OK response, `cheerio` parses the HTML.
9. **Update**: The node helper sends `HONOURS_RESULT` back to the frontend.
10. **Render**: The frontend updates its state and calls `updateDom()` to refresh the display.

## Key Components

### SharedRequestManager
A global singleton that prevents API overload by:
- Throttling requests globally and per-domain.
- Deduplicating simultaneous identical requests.
- Implementing exponential backoff on retries.

### Persistent Caching
Data is saved to `.honours-cache.json` in the module directory. This ensures that the module displays data immediately upon MagicMirror restart, even before the first network request completes.
