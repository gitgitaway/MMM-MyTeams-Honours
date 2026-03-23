# Accessibility Features

This document outlines the accessibility standards and features implemented in the MMM-MyTeams-Honours module.

## Core Accessibility Standards

The module is designed to follow WCAG (Web Content Accessibility Guidelines) best practices to ensure that it is accessible to all users, including those using screen readers and assistive technologies.

### 1. Semantic HTML Structure (A11Y-003)
The module uses standard semantic HTML elements instead of generic `div` containers:
- `<section>`: The main module container is marked as a region for easy navigation.
- `<h2>`: Team names are rendered as headings to provide clear structure.
- `<figure>`: Each trophy and its label are grouped logically within a figure element.
- `<figcaption>`: Trophy labels are correctly associated with their corresponding images.

### 2. ARIA Roles and Live Regions (A11Y-002)
- **Status Regions**: The loading state uses `role="status"` and `aria-live="polite"`. This ensures that screen readers announce "Loading [Team] honours data..." when the module is fetching information.
- **Alert Regions**: If a fetch error occurs, the module uses `role="alert"` to notify the user immediately.
- **Regions**: The module wrapper uses `role="region"` with an `aria-label` set to the team name (e.g., "Celtic FC Honours").

### 3. Screen Reader Context (A11Y-001)
- **Descriptive Labels**: Every trophy count is annotated with a descriptive `aria-label`. For example, a count of "×55" for "National League" is announced as "55 League titles won."
- **Asterisk Indicators**: If a trophy count includes an asterisk (indicating shared titles or predecessor history), the screen reader label is automatically updated to include: "(includes shared or predecessor titles)."
- **Hidden Context**: A visually hidden `<span>` (using the `.sr-only` class) provides full context for each trophy, such as "National Cup: 42 titles."
- **Alt Text**: All trophy images include an `alt` attribute set to the canonical trophy type.

### 4. Color Contrast and Visibility (A11Y-004)
- **Contrast Monitoring**: When `debug` mode is enabled, the module calculates the luminance of any `fontColorOverride` provided in the configuration. If the color is too light (high luminance) for a typical dark MagicMirror background, a warning is logged to the console.
- **Theming Stability**: The module uses CSS custom properties (`--honours-accent`) to ensure that brand colors are applied consistently across all elements.

### 5. Motion and Animations
- **Reduced Motion**: The module respects MagicMirror's `animationSpeed` setting. Users can set this to `0` to disable all transitions if they are sensitive to motion.

## Developer Guidelines
When contributing to this module, please ensure that all new UI elements:
- Use semantic HTML tags.
- Include appropriate ARIA attributes for dynamic content.
- Maintain a contrast ratio of at least 4.5:1 for all text.
- Are tested with a screen reader (e.g., VoiceOver, NVDA) before submission.
