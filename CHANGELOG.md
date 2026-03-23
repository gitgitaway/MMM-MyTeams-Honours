# Changelog for MMM-MyTeams-Honours

All notable changes to the MMM-MyTeams-Honours module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-03-22

### Added
- **Trophy Mapping Guide**: New `mapYourTeamsTrophys-Guide.md` documentation.
- **Enhanced Count Filtering**:  Implemented logic to filter trophies based on trophy change. 
- **Improved Scraper Accuracy**:   - Added automatic skipping of non-winning rows (Runners-up, Finalists, etc.).

### Fixed
- **Season Year Detection**: Fixed `extractNumber` to avoid picking up season tail numbers (e.g., "72" from "1971-72").
- **Celtic European Cup**: Corrected logic that previously picked up the 1969-70 runners-up year instead of the 1966-67 win.

---

## [1.4.0] - 2026-03-22

### Added
- **Universal Club Support**: Replaced hardcoded Scottish competition logic with a 6-canonical-type universal mapper.
  - Supports any club worldwide with a Wikipedia honours section.
- **Shared Trophy & Predecessor Indicators**:
  - Automatically detects "shared" trophies from Wikipedia text.
  - `indicatePredecessor` Added config option for clubs wishing to clain history continuity. 
  - **Accurate Season Ranges**: Improved parsing to support season strings (e.g., "1966-67") and correctly identify the latest win.
- **Improved Count Parsing**: Fixed issues with Wikipedia superscript record markers (e.g., "55s" now correctly parsed as 55).

### Changed
- **Canonical Trophy Mapping**: Updated `trophyMapping` to use universal keys: `National League`, `National Cup`, `National League Cup`, `European Cup`, `UEFA Cup`, `Other`.
- **Parser Robustness**: Enhanced HTML detection to handle modern Wikipedia `mw-heading2` wrappers and 4-column table layouts with rowspans.

### Fixed
- **Celtic European Cup Date**: Now correctly identifies 1966-67 (or 1967) as the win year rather than just the start year (1966).
- **Liverpool/English Club Support**: Fixed missing league titles due to column offset errors in 4-column tables.

---

## [1.3.0] - 2026-03-22

### Added
- **Multi-Language Support**: Full translation support for 8+ languages
  - Includes: English, Irish (ga), Scottish Gaelic (gd), French, German, Spanish, Italian, and Dutch
  - New `Translations_Guide.md` for contributors
- **Multi-Team Support**: Support for a `teams` array in config to rotate between multiple clubs
- **Persistent Caching**: File-based caching system to reduce network requests and improve start-up time
- **Semantic HTML & A11Y**: Rebuilt DOM structure using semantic elements (`<section>`, `<figure>`, `<h2>`) and ARIA live regions
- **CSS Custom Properties**: Modernized styling using CSS variables for easier theme development
- **Comprehensive Documentation**: New specialized guides for Accessibility, Configuration, Debugging, Troubleshooting, and Theming

### Changed
- **Shared Request Management**: All HTTP requests are now coordinated through a central manager with retry logic and rate limiting
- **UI Refresh**: Category-specific background tints for trophies and improved font-based scaling
- **Node Helper Refactor**: Modularized backend logic for better maintainability and error handling

### Fixed
- **XSS Vulnerabilities**: Replaced all `innerHTML` usage with `textContent`
- **Memory Leaks**: Properly cleared intervals and implemented `suspend`/`resume` hooks
- **CSS Injection**: Added strict validation for color and opacity overrides
- **SSRF Protection**: Implemented a hostname allowlist for web scraping

### Technical Details
- Added `getTranslations()` to support MagicMirror's internal translation engine
- Implemented `SharedRequestManager` to handle concurrent team updates efficiently
- Cache stored in `.honours-cache.json` with support for HTTP 304 Not Modified

---

## [1.1.0] - 2024-01-15

### Added
- **Theme Override System**: Introduced comprehensive theme customization options
  - `darkMode` config option (null=auto, true=force dark, false=force light)
  - `fontColorOverride` config option to override all font colors (e.g., "#FFFFFF")
  - `opacityOverride` config option to control element opacity (0.0 to 1.0)
  - Dynamic CSS injection system for applying theme overrides without modifying base styles
- **Enhanced Error Handling**: Improved retry mechanism with configurable retry delays
  - Added timeout handling (10 second timeout for HTTP requests)
  - User-Agent header identification for web scraping requests
  - Better error logging with detailed error messages in console
   **Additional European Tropht Images**: - Added additional European Trophy images to "MMM-MyTeams-Honours\trophyImages"
    

### Changed
- **Trophy Label Logic**: Fixed trophy name parsing to prevent "League Cup" being misidentified as "League"
  - Reordered conditional checks to prioritize "League Cup" detection before "Scottish League"
  - Ensures correct trophy labels are displayed for all trophy types
- **Loading State Styling**: Reduced loading message font size to 80% for better visual consistency
- **Node Helper Improvements**: Enhanced axios configuration with timeout and headers

### Fixed
- **Trophy Name Collision**: Resolved issue where "Scottish League Cup" was incorrectly shortened to "League" instead of "League Cup"
  - Root cause: Conditional check for "Scottish League" was evaluated before "League Cup" check
  - Solution: Reordered if-else conditions in `getShortTrophyName()` method (lines 151-154)

### Technical Details
- Theme override system uses dynamic `<style>` element injection with unique ID `mmm-myteams-honours-theme-override`
- CSS rules applied with `!important` flag to ensure overrides take precedence
- Style element is properly cleaned up when overrides are disabled
- Axios timeout set to 10000ms (10 seconds) to prevent hanging requests

---

## [1.0.0] - 2023-12-01

### Added
- **Initial Release**: Core functionality for displaying team honours
- **Trophy Display System**: Visual representation of major trophies with images
  - Configurable trophy images via `trophyMapping` object
  - Support for Scottish League/Premiership, Scottish Cup, League Cup, and European Cup
  - Trophy images stored in `trophyImages/` directory
- **Trophy Count Display**: Shows the number of times each trophy has been won
  - Configurable count size (small, medium, large)
  - Customizable count color (default: gold #FFD700)
  - Optional display toggle via `showCount` config
- **Trophy Labels**: Descriptive text labels for each trophy type
  - Configurable label size (small, medium, large)
  - Customizable label color (default: white #FFFFFF)
  - Optional display toggle via `showLabels` config
- **Total Honours Counter**: Displays aggregate count of all major honours
  - Optional display toggle via `showTotal` config
- **Web Scraping Engine**: Automated data extraction from Wikipedia
  - Default source: Celtic FC Wikipedia honours section
  - Configurable scrape URL for other teams
  - Cheerio-based HTML parsing
- **Automatic Updates**: Scheduled data refresh system
  - Default update interval: 24 hours
  - Configurable update frequency via `updateInterval`
- **Retry Mechanism**: Automatic retry on failed data fetches
  - Maximum 5 retries by default (configurable via `maxRetries`)
  - 5 second retry delay (configurable via `retryDelay`)
- **Responsive Design**: Flexible layout that adapts to different screen sizes
- **Animation Support**: Smooth fade transitions when updating display
  - Configurable animation speed (default: 1000ms)
- **Debug Mode**: Optional console logging for troubleshooting
  - Enable via `debug: true` in config

### Configuration Options
- `team`: Team name to display (default: "Celtic FC")
- `scrapeUrl`: Wikipedia URL for honours data
- `updateInterval`: Data refresh frequency in milliseconds (default: 24 hours)
- `retryDelay`: Delay before retry on failure (default: 5 seconds)
- `maxRetries`: Maximum retry attempts (default: 5)
- `showTotal`: Display total honours count (default: true)
- `animationSpeed`: Fade animation duration (default: 1000ms)
- `trophySize`: Trophy image dimensions in pixels (default: 64px)
- `trophySpacing`: Space between trophies in pixels (default: 8px)
- `showLabels`: Display trophy labels (default: true)
- `labelSize`: Label text size - small/medium/large (default: "small")
- `showCount`: Display trophy counts (default: true)
- `countSize`: Count text size - small/medium/large (default: "medium")
- `countColor`: Trophy count text color (default: "#FFD700")
- `labelColor`: Trophy label text color (default: "#FFFFFF")
- `trophyMapping`: Object mapping trophy names to image files
- `debug`: Enable debug logging (default: false)

### Dependencies
- **axios** (^0.27.2): HTTP client for web scraping
- **cheerio** (^1.1.2): HTML parsing and DOM manipulation
- **moment.js**: Date/time handling (MagicMirror core dependency)

### Default Trophy Data
- Scottish League/Premier League/Premiership: 55
- Scottish Cup: 42
- Scottish League Cup: 22
- European Cup/Champions League: 1
- Total Major Honours: 120

### File Structure
```
MMM-MyTeams-Honours/
├── MMM-MyTeams-Honours.js      # Main module file (frontend)
├── node_helper.js              # Backend helper for web scraping
├── MMM-MyTeams-Honours.css     # Styling
├── package.json                # Node.js dependencies
├── README.md                   # Documentation
├── CHANGELOG.md                # This file
├── trophyImages/               # Trophy image assets
│   ├── league.png
│   ├── scottish-cup.png
│   ├── league-cup.png
│   ├── european-cup.png
│   └── Other Countries Trophys/ # International trophy images
└── screenshots/                # Module screenshots
    └── screenshot1.png
```

### Known Limitations
- Web scraping depends on Wikipedia page structure (may break if page layout changes)
- Default honours data is hardcoded for Celtic FC
- Parsing for other teams is simplified and may require customization
- Additional Trophy images must be manually added to `trophyImages/` folder. Will try to ad an automated script later

---

## Future Enhancements (Planned)
- **Develop scriopt to auto download more trophys"
### Potential Features
- **Trophy Animation**: Animated trophy reveals and transitions
- **Historical Timeline**: Show when trophies were won with dates
- **Trophy Grouping**: Organize trophies by category (domestic, European, etc.)
- **Responsive Trophy Sizing**: Auto-adjust trophy size based on available space
- **Alternative Data Sources**: Support for other sports statistics websites
- **Trophy Rotation**: Cycle through different trophy views
- **Custom Trophy Icons**: Support for SVG and custom icon sets

### Performance Improvements
- Implement caching to reduce web scraping frequency
- Add data validation to ensure scraped data integrity
- Optimize DOM updates to reduce re-rendering
- Add lazy loading for trophy images

### User Experience
- Add loading spinner animation
- Improve error messages with actionable suggestions
- Add configuration validation with helpful warnings
- Create interactive trophy tooltips with additional details

---

## Version History Summary

| Version | Date       | Key Changes |
|---------|------------|-------------|
| 1.3.0   | 2026-03-22 | Systematic Review implementation (Security, Performance, A11Y, Localization) |
| 1.1.0   | 2024-01-15 | Theme overrides, trophy label fix, enhanced error handling, added European League trophys  |
| 1.0.0   | 2023-12-01 | Initial release with core trophy display functionality |

---

## Contributing

Found a bug or have a feature request? Please open an issue on the GitHub repository.

## License

MIT License - See LICENSE file for details

## Credits

- **Author**: JC's Celtic Man Cave (gitgitaway)
- **Data Source**: Wikipedia (https://en.wikipedia.org/wiki/Celtic_F.C.#Honours)
- **Framework**: MagicMirror² by Michael Teeuw

---

*Last Updated: 2026-03-22*