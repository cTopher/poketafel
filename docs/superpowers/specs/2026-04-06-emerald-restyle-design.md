# Emerald Restyle Design

## Summary

Restyle the entire app to match the Pokemon Emerald GBA aesthetic, with a focus on the battle screen layout and name plates matching the reference screenshot.

## Reference

The reference screenshot (`/Users/kri/Downloads/Screen Shot 2019-11-12 at 18.20.06.png`) shows:
- Bottom panel split: left teal text area with red accent, right white panel with 2x2 action grid
- Name plates with thick dark borders, cream fill, colored HP tag, segmented HP bar
- Player plate includes HP numbers and EXP bar
- Light green/teal color palette throughout

## Battle Screen Bottom Panel

The bottom panel is split into two halves side by side:

**Left half** — teal/green background with a vertical red accent strip on the left edge:
- Menu mode: "What will [pokemon name] do?"
- Fight mode: the multiplication question (e.g., "6 x 7 = ?")
- Catch mode: "Catch it! Answer correctly!"
- Shows wrong answer correction text when applicable

**Right half** — white/cream background with thick dark border:
- Menu mode: 2x2 text-only actions (FIGHT, POKeMON, CATCH, RUN) with triangle selector marker
- Fight mode: 3x2 answer button grid + BACK text at bottom
- Catch mode: 3x2 answer button grid

## Name Plates

Restyle both name plates to match Emerald:

**Shared styling:**
- Thick dark rounded border (~3px solid) with slight drop shadow
- Cream/beige gradient fill
- Top row: name (left-aligned) and "Lv[X]" (right-aligned)
- "HP" label in a small colored tag (green background, white text)
- HP bar: thin with dark track, color-coded fill (green > 50%, yellow > 25%, red <= 25%)

**Enemy plate (top-left):**
- Name, level, HP bar only
- Extends to left edge of screen (no left border)

**Player plate (bottom-right):**
- Name, level, HP bar
- HP numbers displayed (current / max) right-aligned below the HP bar
- XP bar at the very bottom: thin, blue fill, shows progress toward next level
- Extends to right edge of screen (no right border)

## Other Screens

Apply the Emerald aesthetic to all screens:

**Login screen:**
- Lighter Emerald green background instead of dark gradient
- Title in Emerald gold with proper text shadow
- Form fields and textbox use cream fill, thick dark border, slight inner shadow

**Hub screen:**
- Same lighter green palette
- Menu buttons styled as Emerald menu items: white/cream panel, thick dark border, text-only
- Pokemon info area uses cream panel style

**Starter select screen:**
- Emerald green background
- Starter cards use cream panel style with thick borders
- Selected state: highlighted border (gold or darker)

**Collection screen:**
- Emerald green background
- Pokemon cards use cream panel, dark border
- Active pokemon: gold highlighted border

**Battle result screen:**
- Emerald green background
- Result textbox uses cream panel style
- Buttons styled as Emerald menu items

## Global Theme (gba-theme.css)

Update CSS variables to Emerald's actual palette:
- Background greens: lighter, more teal (from the screenshot's arena background)
- Panel surfaces: cream/beige (#f8f0d0-ish range)
- Borders: consistent 3px solid dark (#383838 or #484848)
- Drop shadows: subtle 2px offset, dark
- Button style: no gradients, cream/white background, text-only with optional triangle selector
- HP tag: small rounded pill, green background (#58a028), white "HP" text

## Components Changed

- `gba-theme.css` — updated color palette and global styles
- `NamePlate.tsx` + `.module.css` — full restyle with EXP bar (player only)
- `HpBar.tsx` + `.module.css` — updated track/fill styling
- `ActionMenu.tsx` + `.module.css` — text-only with triangle selectors, white panel
- `BattleChoices.tsx` + `.module.css` — right-half panel styling
- `BattleScreen.tsx` + `.module.css` — split bottom panel layout (left text, right actions)
- `LoginScreen.tsx` + `.module.css` — Emerald palette
- `HubScreen.tsx` + `.module.css` — Emerald palette, menu-style buttons
- `StarterSelectScreen.tsx` + `.module.css` — Emerald palette
- `CollectionScreen.tsx` + `.module.css` — Emerald palette
- `BattleResultScreen.tsx` + `.module.css` — Emerald palette

## Props Changes

- `NamePlate`: add `xp?: number` and `xpToNext?: number` props (optional, only rendered for player side)
- `BattleScreen` bottom panel: restructure JSX to left/right split layout
