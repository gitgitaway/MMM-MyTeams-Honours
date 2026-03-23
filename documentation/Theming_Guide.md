# Theming Guide

This document explains how to customize the appearance of the MMM-MyTeams-Honours module.

## Core CSS Custom Properties

The module uses CSS custom properties (variables) to manage its theme. These properties can be overridden in your `css/custom.css` file without modifying the module's core styles.

### 1. Main Color Tokens
Override these properties on the `.mmm-myteams-honours` selector:

```css
.mmm-myteams-honours {
    --honours-accent: #018749;  /* Main club color (default: Celtic green) */
    --honours-text: #ffffff;    /* General text color */
    --honours-count: #FFD700;   /* Trophy count color (gold) */
    --honours-dimmed: #aaaaaa;  /* Color for secondary or loading text */
}
```

### 2. Category Background Tints
Each trophy item is assigned a background tint based on its category (League, Cup, European):

```css
.mmm-myteams-honours {
    --tint-league: rgba(0, 100, 200, 0.08);   /* Blue tint for league titles */
    --tint-cup: rgba(200, 150, 0, 0.08);      /* Gold tint for domestic cups */
    --tint-european: rgba(0, 0, 160, 0.08);  /* Dark blue tint for European trophies */
    --tint-other: rgba(1, 135, 73, 0.1);     /* Default tint for other categories */
}
```

## Configuration-Based Theming

You can also control the theme directly through the module's configuration:

| Option | Description | Example |
| ------ | ----------- | ------- |
| `accentColor` | Sets the `--honours-accent` property. | `"#C8102E"` (Red) |
| `countColor` | Sets the color for trophy counts. | `"#FFD700"` (Gold) |
| `labelColor` | Sets the color for trophy labels. | `"#FFFFFF"` (White) |
| `darkMode` | `true` (Force Dark), `false` (Force Light), `null` (Auto) | `true` |
| `fontColorOverride` | Forces a specific color for all text in the module. | `"#FFFFFF"` |
| `opacityOverride` | Sets the opacity for all module content (0.0 to 1.0). | `1.0` |

## Advanced Customization

### 1. CSS Scaling vs. Font Sizing
The module now uses predictable font-based scaling (`font-size: 0.8em`) instead of `transform: scale()`. This makes it more stable across different MagicMirror positions. To adjust the overall size of the module, simply change the `font-size` on `.mmm-myteams-honours`.

### 2. Layout Wrapping
Trophies are configured to wrap (`flex-wrap: wrap`) to multiple lines on smaller displays. If you want to force them onto a single line, you can override this in your `custom.css`:

```css
.mmm-myteams-honours .trophy-container {
    flex-wrap: nowrap !important;
    overflow-x: auto;
}
```

### 3. Trophy Background Customization
You can change the shape or padding of the trophy background using the following CSS:

```css
.mmm-myteams-honours .trophy-item img {
    border-radius: 50% !important; /* Circular backgrounds */
    padding: 10px !important;      /* More padding */
    border: 1px solid var(--honours-accent);
}
```
