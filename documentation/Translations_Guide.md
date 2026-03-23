# Translations Guide

This guide explains how translations work in `MMM-MyTeams-Honours` and how you can add support for new languages.

## Supported Languages

The module currently supports the following languages:

- **English** (`en`)
- **Irish** (`ga`)
- **Scottish Gaelic** (`gd`)
- **French** (`fr`)
- **German** (`de`)
- **Spanish** (`es`)
- **Italian** (`it`)
- **Dutch** (`nl`)

The module automatically uses the language configured in your MagicMirror `config.js`.

## How to Add a New Translation

1.  Create a new JSON file in the `translations` folder named with the ISO 639-1 language code (e.g., `pt.json` for Portuguese).
2.  Copy the contents of `en.json` into your new file.
3.  Translate the values (not the keys) into the target language.
4.  Open `MMM-MyTeams-Honours.js` and add your language to the `getTranslations` method:

    ```javascript
    getTranslations: function() {
        return {
            en: "translations/en.json",
            // ... other languages
            pt: "translations/pt.json" // Add this line
        };
    },
    ```

## Translation Keys

- `HONOURS`: The word for "Honours" (used in headers and labels).
- `UNABLE_TO_LOAD`: Message shown when data cannot be fetched.
- `RETRYING`: "Retrying..." message.
- `LOADING`: "Loading" message.
- `HONOURS_DATA`: "honours data..." suffix.
- `TITLES_WON`: Phrase for "titles won" (used by screen readers).
- `TOTAL_MAJOR_HONOURS`: Label for the total count.
- `NATIONAL_LEAGUE`: Canonical key for League titles.
- `NATIONAL_CUP`: Canonical key for primary National Cups (e.g., FA Cup, Scottish Cup).
- `NATIONAL_LEAGUE_CUP`: Canonical key for secondary League Cups.
- `EUROPEAN_CUP`: Canonical key for European Cup / Champions League.
- `UEFA_CUP`: Canonical key for UEFA Cup / Europa League.
- `OTHER`: Canonical key for other trophies.
- `TITLES`: The word for "titles" (used by screen readers).
