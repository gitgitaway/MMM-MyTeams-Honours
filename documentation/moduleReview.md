# MMM-MyTeams-Honours — Module Review

**Review Date:** March 2026  
**Reviewer:** Zencoder AI  
**Module Version:** 1.3.0  
**Files Reviewed:** `MMM-MyTeams-Honours.js`, `node_helper.js`, `MMM-MyTeams-Honours.css`, `shared-request-manager.js`, `package.json`, `SECURITY.md`, `README.md`, `CHANGELOG.md`

---

## Executive Summary

**UPDATE (March 2026): All recommendations from this review have been successfully implemented in version 1.4.0.**

The module now features a robust security architecture, a persistent file-based caching layer, full ARIA-compliant accessibility support, and a modern CSS Custom Property-based design. The legacy Celtic-specific hardcoding has been replaced with a universal 6-canonical-type system that supports any club worldwide. Version 1.4.0 also adds automated "shared trophy" detection and an optional asterisk for clubs with predecessor/liquidation history. Accurate season ranges (e.g., "1966-67") are now supported for all clubs.

---

## Review Findings & Recommendations

### 1 · Security

---

#### SEC-001 — XSS Risk via `innerHTML` Assignments

| Field | Detail |
|---|---|
| **ID** | SEC-001 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 81, 107, 116, 130 |

**Finding:**  
Multiple DOM nodes are populated using `innerHTML` with data sourced from module config or scraped/parsed content. If a user supplies a team name containing HTML, or if a compromised Wikipedia page returns malicious HTML fragments parsed through cheerio, this data flows directly into the DOM without sanitisation.

```javascript
header.innerHTML = this.config.team + " Honours";
countDiv.innerHTML = "×" + this.honours[trophyType];
labelDiv.innerHTML = this.getShortTrophyName(trophyType);
totalDiv.innerHTML = "Total Major Honours: " + this.totalHonours;
```

**Recommendation:**  
Replace every `innerHTML` assignment that uses dynamic data with `textContent`. Reserve `innerHTML` only for literal, developer-controlled strings.

```javascript
header.textContent = `${this.config.team} Honours`;
countDiv.textContent = `×${this.honours[trophyType]}`;
labelDiv.textContent = this.getShortTrophyName(trophyType);
totalDiv.textContent = `Total Major Honours: ${this.totalHonours}`;
```

**Justification:** `textContent` is browser-sanitised by design. This is a zero-cost change that eliminates the XSS attack surface entirely.

---

#### SEC-002 — CSS Injection via `fontColorOverride`

| Field | Detail |
|---|---|
| **ID** | SEC-002 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 249–251 |

**Finding:**  
The `fontColorOverride` value is interpolated directly into a `<style>` element without any validation. A malicious or misconfigured value such as `red !important; } body { display:none` could inject arbitrary CSS rules into the document.

```javascript
css += `.mmm-myteams-honours * { color: ${this.config.fontColorOverride} !important; }\n`;
```

**Recommendation:**  
Validate the override value against a strict CSS colour pattern before use.

```javascript
const isValidColor = (c) => /^(#[0-9A-Fa-f]{3,8}|rgba?\([\d,.\s]+\)|[a-zA-Z]+)$/.test(c);
if (this.config.fontColorOverride && isValidColor(this.config.fontColorOverride)) {
    css += `.mmm-myteams-honours * { color: ${this.config.fontColorOverride} !important; }\n`;
}
```

**Justification:** CSS injection through user-controlled style elements can affect the entire MagicMirror interface, not just this module.

---

#### SEC-003 — No URL Allowlist for `scrapeUrl`

| Field | Detail |
|---|---|
| **ID** | SEC-003 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` line 32 |

**Finding:**  
The `scrapeUrl` configuration value is passed directly to the request manager with no validation. A user could point the module at an internal network address (e.g., `http://localhost/admin`) or a data-exfiltration endpoint.

**Recommendation:**  
Validate the URL in `node_helper.js` before queueing the request.

```javascript
const ALLOWED_HOSTNAMES = ["en.wikipedia.org", "www.wikipedia.org"];
const urlObj = new URL(payload.scrapeUrl);
if (!ALLOWED_HOSTNAMES.includes(urlObj.hostname)) {
    this.sendSocketNotification("HONOURS_RESULT", { error: "scrapeUrl hostname not permitted." });
    return;
}
```

**Justification:** Server-side request forgery (SSRF) protection prevents the module's HTTP client from being weaponised against the local network.

---

#### SEC-004 — Malformed `package.json` (Missing Closing Brace)

| Field | Detail |
|---|---|
| **ID** | SEC-004 |
| **Status** | ✅ COMPLETED |
| **File** | `package.json` |

**Finding:**  
The `repository` object is not closed before `dependencies` begins, producing invalid JSON. `npm audit` and `npm publish` may silently fail or produce misleading results.

```json
"repository": {
    "type": "git",
    "url": "https://github.com/gitgitaway/MMM-MyTeams-Honours.git",
"dependencies": { ...
```

**Recommendation:**  
Close the `repository` object correctly:

```json
"repository": {
    "type": "git",
    "url": "https://github.com/gitgitaway/MMM-MyTeams-Honours.git"
},
"dependencies": { ...
```

**Justification:** Invalid `package.json` can cause silent failures in security auditing tooling and break CI pipelines.

---

#### SEC-005 — Backup Files Committed to Version Control

| Field | Detail |
|---|---|
| **ID** | SEC-005 |
| **Status** | ✅ COMPLETED |
| **File** | `.gitignore/node_helper.js.bak`, `.gitignore/node_helper.js.new` |

**Finding:**  
Legacy backup files (`node_helper.js.bak`, `node_helper.js.new`) reside in the repository. These may expose development history, commented-out credentials, or deprecated logic.

**Recommendation:**  
Delete the backup files and add `*.bak` and `*.new` patterns to `.gitignore`.

**Justification:** Backup files in repositories are a common source of accidental secret or logic exposure during code audits.

---

### 2 · Performance

---

#### PERF-001 — `setInterval` in `scheduleUpdate` is Never Cleared

| Field | Detail |
|---|---|
| **ID** | PERF-001 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 165–173 |

**Finding:**  
`scheduleUpdate` uses `setInterval` but stores no reference to the interval handle, making it impossible to cancel. If the module is suspended or restarted by MagicMirror, multiple overlapping intervals accumulate, causing redundant network calls and eventual memory exhaustion.

```javascript
setInterval(function() {
    self.updateHonours();
}, this.config.updateInterval);
```

**Recommendation:**  

```javascript
start: function() {
    this.updateTimer = null;
    this.scheduleUpdate();
},
scheduleUpdate: function() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    this.updateTimer = setInterval(() => this.updateHonours(), this.config.updateInterval);
    this.updateHonours();
},
suspend: function() {
    if (this.updateTimer) clearInterval(this.updateTimer);
},
resume: function() {
    this.scheduleUpdate();
},
```

**Justification:** Prevents interval accumulation across module restarts, reducing CPU load and eliminating duplicate HTTP requests.

---

#### PERF-002 — `moment.js` Declared but Never Used

| Field | Detail |
|---|---|
| **ID** | PERF-002 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` line 43 |

**Finding:**  
`getScripts` returns `["moment.js"]`, causing MagicMirror to load the full moment.js library (≈ 300 KB minified) even though no moment API is called anywhere in the module.

**Recommendation:**  
Remove `moment.js` from `getScripts`:

```javascript
getScripts: function() {
    return [];
},
```

**Justification:** Eliminates an unnecessary 300 KB script download and parse cycle on every page load.

---

#### PERF-003 — `_applyThemeOverrides` Called on Every DOM Render

| Field | Detail |
|---|---|
| **ID** | PERF-003 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` line 67 |

**Finding:**  
`_applyThemeOverrides()` performs DOM queries (`document.getElementById`) and may create or mutate a `<style>` element on every `getDom()` call. Since theme config does not change at runtime, this work is wasted on every update cycle.

**Recommendation:**  
Call `_applyThemeOverrides()` once in `start()` and again only if config is updated, rather than inside `getDom()`.

**Justification:** Removes repeated DOM manipulation from the hot render path.

---

#### PERF-004 — Recursive Retry in `executeRequest` Can Overflow the Call Stack

| Field | Detail |
|---|---|
| **ID** | PERF-004 |
| **Status** | ✅ COMPLETED |
| **File** | `shared-request-manager.js` lines 344–346 |

**Finding:**  
On retry, `executeRequest` calls itself recursively after re-queuing the request. With `maxRetries: 3` and exponential backoff delays this is unlikely to overflow in practice, but it is architecturally fragile and mixes queue management with execution.

**Recommendation:**  
Use a loop-based retry within `executeRequest` rather than recursion, or resolve the promise to a retry-queued result rather than calling itself.

**Justification:** Recursive async functions that sleep between retries hold the call stack frame open across `await` boundaries and may cause unexpected behaviour under long backoff delays.

---

#### PERF-005 — `axios` Listed as Dependency but Not Used

| Field | Detail |
|---|---|
| **ID** | PERF-005 |
| **Status** | ✅ COMPLETED |
| **File** | `package.json` line 21 |

**Finding:**  
`axios` is declared as a dependency (`^0.27.2`) but is not imported in any module file. The actual HTTP layer uses `node-fetch` via `shared-request-manager.js`. The unused package adds ≈ 400 KB to `node_modules` and appears in `npm audit` results.

**Recommendation:**  
Remove `axios` from `package.json` and run `npm install` to update the lockfile.

**Justification:** Leaner dependency tree, faster installs, and a smaller audit surface.

---

#### PERF-006 — Trophy Images Not Lazy-Loaded

| Field | Detail |
|---|---|
| **ID** | PERF-006 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 95–99 |

**Finding:**  
Trophy `<img>` elements are created without a `loading` attribute. On lower-power Raspberry Pi hardware, simultaneous image decoding can cause a visible render delay.

**Recommendation:**  

```javascript
trophyImg.loading = "lazy";
trophyImg.decoding = "async";
```

**Justification:** Browser-native hints that defer off-screen image decode and free the main thread.

---

### 3 · Accessibility

---

#### A11Y-001 — Numeric Counts Lack Screen Reader Context

| Field | Detail |
|---|---|
| **ID** | A11Y-001 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 103–109 |

**Finding:**  
The trophy count is rendered as `×55` with no accessible label. A screen reader announces "times 55" with no indication of *which* trophy this count refers to.

**Recommendation:**  

```javascript
countDiv.setAttribute("aria-label", `${this.honours[trophyType]} titles won`);
```

Also add a visually hidden `<span>` for context:

```javascript
const sr = document.createElement("span");
sr.className = "sr-only";
sr.textContent = `${trophyType}: ${this.honours[trophyType]} titles`;
trophyDiv.appendChild(sr);
```

**Justification:** Ensures assistive technologies convey meaningful information rather than isolated numerals.

---

#### A11Y-002 — Loading State Has No ARIA Live Region

| Field | Detail |
|---|---|
| **ID** | A11Y-002 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 70–76 |

**Finding:**  
The loading state `div` has no `role` or `aria-live` attribute. Screen readers will not announce when the module transitions from loading to displaying data.

**Recommendation:**  

```javascript
wrapper.setAttribute("role", "status");
wrapper.setAttribute("aria-live", "polite");
wrapper.setAttribute("aria-label", "Loading honours data");
```

**Justification:** Provides screen reader users the same loading feedback that sighted users receive visually.

---

#### A11Y-003 — No Semantic HTML Structure

| Field | Detail |
|---|---|
| **ID** | A11Y-003 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` |

**Finding:**  
The entire module renders as nested `<div>` elements. Using semantic elements (`<section>`, `<h2>` for the header, `<figure>`/`<figcaption>` for trophy + label pairs) improves assistive technology navigation and document outline.

**Recommendation:**  
Replace the header `div` with `<h2>`, wrap each trophy in `<figure>` with the label as `<figcaption>`, and wrap the module in `<section role="region" aria-label="…">`.

**Justification:** Semantic markup is a low-effort change that meaningfully improves screen reader navigation.

---

#### A11Y-004 — Color Contrast Not Validated for All Theme Combinations

| Field | Detail |
|---|---|
| **ID** | A11Y-004 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css`, `MMM-MyTeams-Honours.js` |

**Finding:**  
Celtic green (`#018749`) against a dark background passes WCAG AA, but the runtime `fontColorOverride` and `darkMode` combinations are not validated. A user could configure white text on a light background.

**Recommendation:**  
Document the minimum recommended contrast ratios in README and, optionally, warn in the console when `debug: true` if the configured colours fail a basic luminance check.

**Justification:** Ensures the module remains legible across all user-defined theme combinations.

---

### 4 · Cache

---

#### CACHE-001 — No Caching Layer; `fetchedData` Declared but Unused

| Field | Detail |
|---|---|
| **ID** | CACHE-001 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` line 18 |

**Finding:**  
`this.fetchedData = {}` is initialised in `start()` but is never written to or read from. The module makes a full HTTP request to Wikipedia on every 24-hour cycle with no HTTP conditional request (`If-None-Match` / `If-Modified-Since`) and no local cache. If Wikipedia changes its page structure, cached stale data cannot fall back gracefully.

**Recommendation:**  
Implement a simple file-based or in-memory cache in `node_helper.js`:

```javascript
start: function() {
    this.cache = { data: null, timestamp: 0 };
},

fetchHonours: function(url, team) {
    const now = Date.now();
    const cacheAge = now - this.cache.timestamp;
    const maxAge = 23 * 60 * 60 * 1000; // 23 hours

    if (this.cache.data && cacheAge < maxAge) {
        this.sendSocketNotification("HONOURS_RESULT", this.cache.data);
        return;
    }
    // ... proceed with HTTP request, then:
    // this.cache = { data: result, timestamp: Date.now() };
},
```

**Justification:** Eliminates redundant Wikipedia requests on module restart, survives temporary network outages, and reduces load on the Wikipedia infrastructure.

---

#### CACHE-002 — No HTTP Conditional Request Headers

| Field | Detail |
|---|---|
| **ID** | CACHE-002 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` lines 42–51 |

**Finding:**  
Requests do not send `If-None-Match` or `If-Modified-Since` headers, so Wikipedia must return the full HTML payload on every request (typically several hundred KB) even when the content has not changed.

**Recommendation:**  
Cache the `ETag` / `Last-Modified` response header on first fetch and include it in subsequent requests. Treat HTTP 304 responses as cache hits.

**Justification:** Reduces bandwidth by up to 100% on unchanged-content requests; also reduces the module's footprint against Wikipedia's usage policies.

---

#### CACHE-003 — No Persistent Cache Across MagicMirror Restarts

| Field | Detail |
|---|---|
| **ID** | CACHE-003 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` |

**Finding:**  
All in-memory state is lost on every MagicMirror restart. On startup the module shows the loading message until the first successful fetch completes, which can take several seconds.

**Recommendation:**  
Persist the last-fetched honours payload to a JSON file in the module directory and load it on `start()` to provide an immediate initial render while the live fetch runs in the background.

```javascript
const CACHE_FILE = path.join(__dirname, ".honours-cache.json");

start: function() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            this.cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
        }
    } catch (_) { this.cache = null; }
},
```

**Justification:** Eliminates the loading flash on restart and provides data continuity during network outages.

---

### 5 · Debugging

---

#### DBG-001 — Inconsistent Logging: Mix of `console.log` and `Log`

| Field | Detail |
|---|---|
| **ID** | DBG-001 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` throughout |

**Finding:**  
`node_helper.js` uses raw `console.log` / `console.error` throughout, while the MagicMirror standard is to use the `Log` module (already imported). The `debug` flag in the frontend config has no effect on node_helper verbosity.

**Recommendation:**  
Replace all `console.log` calls with `Log.info(...)` and `console.error` with `Log.error(...)`. Wire the frontend `config.debug` value into a socket notification on startup so node_helper can toggle its own verbosity:

```javascript
// In node_helper start or a dedicated notification:
socketNotificationReceived: function(notification, payload) {
    if (notification === "SET_CONFIG") {
        this.debug = payload.debug;
    }
}
```

**Justification:** Consistent logging output, respects MagicMirror's log level conventions, and allows operators to silence the module without code changes.

---

#### DBG-002 — `debug` Flag Does Not Propagate to `SharedRequestManager`

| Field | Detail |
|---|---|
| **ID** | DBG-002 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js`, `shared-request-manager.js` |

**Finding:**  
The `SharedRequestManager` has its own `debug` config flag (defaulting to `false`) and a public `enableDebug()` method, but there is no path from the module's `debug: true` config option to enabling manager-level debug output.

**Recommendation:**  

```javascript
// In node_helper.js socketNotificationReceived for GET_HONOURS:
if (payload.debug) {
    requestManager.enableDebug();
}
```

**Justification:** When a developer enables `debug: true`, they should see the full request lifecycle, not just module-level logs.

---

#### DBG-003 — Hardcoded Celtic FC Honours Bypasses Scraper Silently

| Field | Detail |
|---|---|
| **ID** | DBG-003 |
| **Status** | ✅ COMPLETED |
| **File** | `node_helper.js` lines 84–90 |

**Finding:**  
When `team === "Celtic FC"`, the scraper result is entirely ignored and hardcoded values are returned. This means the `scrapeUrl` fetch is wasted bandwidth for the default team, stale values are never updated when Celtic win additional honours, and there is no indication to the developer that scraping was bypassed. This is also architecturally misleading — the module appears to scrape but does not for its default case.

**Recommendation:**  
Remove the hardcoded branch and implement a robust scraper parser, or at minimum add a console warning:

```javascript
if (team === "Celtic FC") {
    Log.warn(this.name + ": Using hardcoded data for Celtic FC. Set debug:true to verify scraping.");
}
```

Long-term, invest in a reliable HTML parser path for all teams (see INN-001).

**Justification:** The hardcoded bypass defeats the module's primary purpose, prevents data freshness, and misleads developers debugging scraper issues.

---

### 6 · Innovation

---

#### INN-001 — Replace Fragile Wikipedia Scraper with Structured Data API

| Field | Detail |
|---|---|
| **ID** | INN-001 |
| **Status** | ✅ COMPLETED |

**Finding:**  
The scraper depends on Wikipedia's HTML structure remaining stable. Wikipedia's Wikidata project exposes a machine-readable SPARQL endpoint that returns structured club honours data with no HTML parsing required, and is far less likely to break silently.

**Recommendation:**  
Offer an optional `useWikidata: true` config mode that queries the Wikidata SPARQL API:

```
https://query.wikidata.org/sparql?query=...&format=json
```

This returns structured JSON — no cheerio parsing required. The scraper path can remain as a fallback.

**Justification:** Structured data sources are significantly more reliable than HTML scraping and reduce maintenance burden when Wikipedia redesigns pages.

---

#### INN-002 — Multi-Team Support

| Field | Detail |
|---|---|
| **ID** | INN-002 |
| **Status** | ✅ COMPLETED |

**Finding:**  
The module supports only a single team. Many football fans follow multiple clubs (e.g., national team + club).

**Recommendation:**  
Allow `config.teams` to be an array of `{ team, scrapeUrl, trophyMapping }` objects. Cycle through them on a configurable `rotationInterval` (e.g., 10 seconds) with a smooth transition animation.

**Justification:** Increases utility for a broad audience with minimal architectural change.

---

#### INN-003 — Historical Timeline View

| Field | Detail |
|---|---|
| **ID** | INN-003 |
| **Status** | ✅ COMPLETED |

**Finding:**  
The module shows totals only. Wikidata (see INN-001) exposes individual trophy win years, enabling a timeline or "most recent win" display.

**Recommendation:**  
Add an optional `showLastWon: true` config that displays the year of the most recent win beneath each trophy count, e.g., *"Last won: 2024"*.

**Justification:** Adds meaningful context to raw counts and makes the display more engaging.

---

#### INN-004 — CSS Custom Property Theming

| Field | Detail |
|---|---|
| **ID** | INN-004 |
| **Status** | ✅ COMPLETED |

**Finding:**  
Colours and sizes are scattered across inline styles and the CSS file with no use of CSS custom properties. This makes theming for other clubs (e.g., Rangers blue, Liverpool red) unnecessarily complex.

**Recommendation:**  
Define CSS custom properties on `.mmm-myteams-honours` and reference them throughout:

```css
.mmm-myteams-honours {
    --honours-accent: #018749;
    --honours-text: #ffffff;
    --honours-count-color: #FFD700;
}
.honours-header { color: var(--honours-accent); }
.total-honours { color: var(--honours-accent); }
```

Users can then override just `--honours-accent` via `fontColorOverride` or a custom stylesheet.

**Justification:** Drastically simplifies club-specific theming and reduces the need for the JavaScript `_applyThemeOverrides` system.

---

### 7 · UI/UX Experience

---

#### UX-001 — Hardcoded `margin-left: -30px` is Fragile

| Field | Detail |
|---|---|
| **ID** | UX-001 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css` line 10 |

**Finding:**  
`margin-left: -30px` is a hack to visually centre the scaled module and will mis-align the module in most MagicMirror positions (left, right, fullscreen) as well as on screens with different DPI or resolution. Combined with `transform: scale(0.8)`, the layout is brittle.

**Recommendation:**  
Remove the negative margin and replace the scale-based approach with proper font sizing and padding control:

```css
.mmm-myteams-honours {
    text-align: center;
    padding: 8px;
    color: var(--honours-accent, #018749);
    font-size: 0.8em; /* Scale text, not the container */
}
```

**Justification:** Eliminates positional bugs, makes the module render correctly in all MagicMirror positions, and improves layout predictability.

---

#### UX-002 — No Error State Displayed to the User

| Field | Detail |
|---|---|
| **ID** | UX-002 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 190–199 |

**Finding:**  
When `payload.error` is set, the module logs to the console and schedules a retry but does not update the DOM. The display remains blank or stuck on the loading message, giving the user no indication that an error occurred.

**Recommendation:**  
Render an error state:

```javascript
if (payload.error) {
    this.error = payload.error;
    this.updateDom(this.config.animationSpeed);
}
// In getDom():
if (this.error && !this.loaded) {
    wrapper.textContent = "Unable to load honours data. Retrying…";
    wrapper.className = "dimmed light small";
    return wrapper;
}
```

**Justification:** Surfaces actionable feedback to the user and reduces confusion when the module silently fails.

---

#### UX-003 — No Loading Spinner; Text-Only Loading State

| Field | Detail |
|---|---|
| **ID** | UX-003 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.js` lines 70–76 |

**Finding:**  
The loading state shows static text. On slower connections this can persist for several seconds with no visual activity indicator.

**Recommendation:**  
Add a CSS `@keyframes` spinner using a Unicode trophy or a simple rotating ring element. MagicMirror's built-in `fa-spin` Font Awesome class can also be applied to an `<i>` element for a zero-asset spinner.

```javascript
const spinner = document.createElement("i");
spinner.className = "fas fa-trophy fa-spin";
wrapper.appendChild(spinner);
```

**Justification:** Provides reassurance that the module is active and loading rather than broken.

---

#### UX-004 — Trophy Container Overflow Not Graceful on Small Displays

| Field | Detail |
|---|---|
| **ID** | UX-004 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css` lines 21–27 |

**Finding:**  
`flex-wrap: nowrap` forces all trophies onto a single line. With `overflow-x: auto`, this creates a scrollbar on small displays, but the `transform: scale(0.8)` parent can interfere with scroll hit areas.

**Recommendation:**  
Allow wrapping as a fallback and use a `max-width` on the container keyed to the configured `trophySize` and count. Alternatively, expose a `wrapTrophies: true` config option.

```css
.trophy-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
}
```

**Justification:** Ensures graceful layout degradation on all screen sizes and MagicMirror panel widths.

---

### 8 · Design & Aesthetics

---

#### DES-001 — Club Colour Hardcoded in CSS; Not Truly Themeable

| Field | Detail |
|---|---|
| **ID** | DES-001 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css` lines 17, 70, 79 |

**Finding:**  
Celtic green (`#018749`) appears four times in the CSS file and is also embedded in a JavaScript-generated `rgba()` background for trophy images. Users following other clubs must edit the CSS directly to match their team colours.

**Recommendation:**  
Expose `accentColor` as a config option and apply it via a CSS custom property set inline on the wrapper, complementing INN-004:

```javascript
wrapper.style.setProperty("--honours-accent", this.config.accentColor || "#018749");
```

**Justification:** Makes the module genuinely multi-team without requiring CSS file edits.

---

#### DES-002 — Misleading CSS Comments ("60% bigger than half size")

| Field | Detail |
|---|---|
| **ID** | DES-002 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css` throughout |

**Finding:**  
Every font-size rule carries a comment such as `/* 60% bigger than half size (0.4em) */`. These comments reflect a previous iterative design process and are now misleading (0.64em is not "60% bigger than 0.4em" nor is it directly meaningful). They add noise and confusion for any future contributor.

**Recommendation:**  
Replace with meaningful comments describing the intent:

```css
.trophy-label.small  { font-size: 0.64em; } /* compact: fits tight layouts */
.trophy-label.medium { font-size: 0.80em; }
.trophy-label.large  { font-size: 0.96em; } /* near-full-size text */
```

**Justification:** Clean, intent-driven comments reduce onboarding time for contributors and eliminate confusion.

---

#### DES-003 — No Visual Differentiation Between Trophy Types at a Glance

| Field | Detail |
|---|---|
| **ID** | DES-003 |
| **Status** | ✅ COMPLETED |
| **File** | `MMM-MyTeams-Honours.css`, `trophyImages/` |

**Finding:**  
All trophy images share the same Celtic-green tinted background (`rgba(1, 135, 73, 0.1)`). Assigning a subtle, distinct background tint per trophy category (domestic league, cup, European) would help visually group and distinguish trophy types.

**Recommendation:**  
Add data attributes per trophy category on `trophyDiv` and use CSS attribute selectors:

```javascript
trophyDiv.dataset.category = this.getTrophyCategory(trophyType);
```

```css
.trophy-item[data-category="league"] img   { background-color: rgba(0, 100, 200, 0.08); }
.trophy-item[data-category="cup"] img      { background-color: rgba(200, 150, 0, 0.08); }
.trophy-item[data-category="european"] img { background-color: rgba(0, 0, 160, 0.08); }
```

**Justification:** Improves at-a-glance visual parsing, especially when trophy images are similar in shape.

---

## Summary Table

| ID | Area | Priority | Title |
|---|---|---|---|
| SEC-001 | Security | 🔴 High | XSS via `innerHTML` assignments |
| SEC-002 | Security | 🔴 High | CSS injection via `fontColorOverride` |
| SEC-003 | Security | 🟠 Medium | No URL allowlist for `scrapeUrl` |
| SEC-004 | Security | 🟠 Medium | Malformed `package.json` |
| SEC-005 | Security | 🟡 Low | Backup files in version control |
| PERF-001 | Performance | 🔴 High | `setInterval` never cleared |
| PERF-002 | Performance | 🟠 Medium | `moment.js` loaded but unused |
| PERF-003 | Performance | 🟠 Medium | Theme overrides recalculated every render |
| PERF-004 | Performance | 🟠 Medium | Recursive retry risks stack overflow |
| PERF-005 | Performance | 🟡 Low | `axios` declared but not used |
| PERF-006 | Performance | 🟡 Low | Trophy images not lazy-loaded |
| A11Y-001 | Accessibility | 🟠 Medium | Counts lack screen reader context |
| A11Y-002 | Accessibility | 🟠 Medium | Loading state has no ARIA live region |
| A11Y-003 | Accessibility | 🟡 Low | No semantic HTML elements |
| A11Y-004 | Accessibility | 🟡 Low | Colour contrast not validated |
| CACHE-001 | Cache | 🔴 High | No caching; `fetchedData` unused |
| CACHE-002 | Cache | 🟠 Medium | No conditional HTTP request headers |
| CACHE-003 | Cache | 🟡 Low | No persistent cache across restarts |
| DBG-001 | Debugging | 🟠 Medium | Inconsistent `console.log` vs `Log` |
| DBG-002 | Debugging | 🟠 Medium | `debug` flag not wired to request manager |
| DBG-003 | Debugging | 🔴 High | Celtic FC hardcode silently bypasses scraper |
| INN-001 | Innovation | 🟠 Medium | Replace scraper with Wikidata API |
| INN-002 | Innovation | 🟡 Low | Multi-team rotation support |
| INN-003 | Innovation | 🟡 Low | Historical timeline / last-won year |
| INN-004 | Innovation | 🟡 Low | CSS custom property theming system |
| UX-001 | UI/UX | 🔴 High | `margin-left: -30px` layout hack |
| UX-002 | UI/UX | 🟠 Medium | No error state displayed to user |
| UX-003 | UI/UX | 🟡 Low | No loading spinner |
| UX-004 | UI/UX | 🟡 Low | Trophy overflow not graceful |
| DES-001 | Design | 🟠 Medium | Club colour hardcoded; not themeable |
| DES-002 | Design | 🟡 Low | Misleading CSS comments |
| DES-003 | Design | 🟡 Low | No visual differentiation between trophy types |

---

## Recommended Implementation Strategy

### Phase 1 — Critical Fixes (Immediate)

Address all 🔴 High priority items first. These have either a security impact or cause active functional defects.

| Order | ID | Action |
|---|---|---|
| 1 | SEC-001 | Replace `innerHTML` with `textContent` throughout `getDom()` |
| 2 | SEC-002 | Add colour validation regex to `_applyThemeOverrides` |
| 3 | DBG-003 | Remove hardcoded Celtic FC data; implement proper scraper fallback |
| 4 | PERF-001 | Store and clear `setInterval` handle; implement `suspend`/`resume` |
| 5 | CACHE-001 | Implement in-memory cache in `node_helper.js` using `fetchedData` |
| 6 | UX-001 | Remove `margin-left: -30px`; replace `transform: scale()` with `font-size` |

### Phase 2 — Stability & Standards (Short Term)

Address 🟠 Medium items. These improve reliability, developer experience and standards compliance.

| Order | ID | Action |
|---|---|---|
| 7 | SEC-003 | Add URL hostname allowlist in `node_helper.js` |
| 8 | SEC-004 | Fix malformed `package.json` |
| 9 | PERF-002 | Remove `moment.js` from `getScripts` |
| 10 | PERF-003 | Move `_applyThemeOverrides` out of `getDom` into `start` |
| 11 | PERF-004 | Refactor retry logic from recursive to iterative |
| 12 | CACHE-002 | Add ETag / If-None-Match conditional request support |
| 13 | DBG-001 | Replace `console.log` with `Log` throughout `node_helper.js` |
| 14 | DBG-002 | Wire `config.debug` to `requestManager.enableDebug()` |
| 15 | A11Y-001 | Add `aria-label` to trophy count and label elements |
| 16 | A11Y-002 | Add `role="status"` and `aria-live="polite"` to loading state |
| 17 | UX-002 | Render error state in `getDom` when fetch fails |
| 18 | DES-001 | Expose `accentColor` config; apply via CSS custom property |
| 19 | INN-001 | Research and prototype Wikidata SPARQL integration |

### Phase 3 — Enhancement & Polish (Medium Term)

Address 🟡 Low priority items. These improve aesthetics, accessibility depth and future extensibility.

| Order | ID | Action |
|---|---|---|
| 20 | PERF-005 | Remove unused `axios` dependency |
| 21 | PERF-006 | Add `loading="lazy"` and `decoding="async"` to trophy images |
| 22 | CACHE-003 | Implement file-based persistent cache |
| 23 | SEC-005 | Delete `.bak` / `.new` backup files; add patterns to `.gitignore` |
| 24 | A11Y-003 | Introduce semantic HTML (`<section>`, `<h2>`, `<figure>`) |
| 25 | A11Y-004 | Document contrast requirements; add debug-mode contrast warning |
| 26 | UX-003 | Add CSS spinner to loading state |
| 27 | UX-004 | Allow `flex-wrap: wrap` for small display graceful degradation |
| 28 | DES-002 | Update CSS comments to be intent-driven |
| 29 | DES-003 | Add trophy category data attributes and per-category tint |
| 30 | INN-002 | Design multi-team rotation config schema |
| 31 | INN-003 | Add `showLastWon` config with Wikidata year data |
| 32 | INN-004 | Migrate all colour tokens to CSS custom properties |

### Status Summary — March 2026

**All items in Phase 1, 2, and 3 have been FULLY IMPLEMENTED.**

- ✅ **Security**: XSS/CSS protection, Hostname allowlist, Validated overrides.
- ✅ **Performance**: Persistent caching, No memory leaks, Iterative retries.
- ✅ **A11Y**: Semantic HTML, ARIA regions, Descriptive labels.
- ✅ **UX/UI**: Multiple team rotation, Category tints, CSS Custom Properties.
- ✅ **Localization**: Support for 8+ languages including ga/gd.
- ✅ **Documentation**: Complete suite of specialized guides.

---

*Review prepared by Zencoder AI — March 2026*
