# CLAUDE.md

## Styling

- Always use CSS modules (`.module.css`) for component styles. No inline CSS (`style={{}}`).
- Only use inline styles for truly dynamic values that depend on runtime props (e.g., computed transforms, dynamic widths, conditional colors).
- Global styles and CSS variables live in `app/src/gba-theme.css`.
