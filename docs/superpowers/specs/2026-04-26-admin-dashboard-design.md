# Admin Dashboard Design

## Overview

A server-rendered admin dashboard at `/admin` for monitoring player activity in Pokétafel. Personal use only — no authentication required. Clean, modern visual style (not GBA-themed).

## Architecture

A single Cloudflare Pages Function at `functions/admin.ts` that:

1. Queries the Neon Postgres database for activity stats
2. Returns a complete HTML page with data embedded as JSON
3. Uses Chart.js (loaded from CDN) for trend charts on the client side

The function checks for a `trainer` query parameter:
- **No param** → overview page
- **`?trainer=<id>`** → player detail page

No new database tables. All data comes from existing `trainers`, `answers`, and `pokemon_collection` tables.

## Pages

### Overview Page (`/admin`)

**Summary stat cards (top row):**
- Total trainers — count from `trainers`
- Active this week — distinct trainers with answers in the last 7 days
- Answers this week — count from `answers` in the last 7 days
- Total Pokémon caught — count from `pokemon_collection`

**Daily activity chart:**
- Bar chart showing answers per day over the last 30 days
- Rendered with Chart.js

**Recent players table:**
- Last 10 active trainers (by most recent answer)
- Columns: trainer name (clickable link to detail), last active, total answers, correct %, Pokémon count
- Joined from `trainers`, `answers`, and `pokemon_collection`
- Clicking a trainer name navigates to `/admin?trainer=<id>`

### Player Detail Page (`/admin?trainer=<id>`)

**Header:**
- Back link to `/admin`
- Trainer name, join date, favorite number

**Summary stat cards (top row):**
- Total answers
- Correct count (green) with percentage
- Wrong count (red) with percentage
- Pokémon caught

**Daily activity chart:**
- Stacked/grouped bar chart showing correct vs wrong answers per day over the last 30 days
- Legend: green = correct, red = wrong

**Two-column bottom section:**

Left — **Hardest tables:**
- Top 5 multiplication pairs with lowest accuracy
- Columns: table (e.g. "7 × 8"), accuracy %, visual bar
- Color-coded: red (<50%), amber (50-65%), green (>65%)

Right — **Pokémon collection:**
- All caught Pokémon displayed as pills/tags
- Shows name and level
- Active Pokémon highlighted with blue border

## Queries

### Overview stats
```sql
-- Total trainers
SELECT COUNT(*) FROM trainers;

-- Active this week
SELECT COUNT(DISTINCT trainer_id) FROM answers
WHERE created_at > NOW() - INTERVAL '7 days';

-- Answers this week
SELECT COUNT(*) FROM answers
WHERE created_at > NOW() - INTERVAL '7 days';

-- Total pokemon
SELECT COUNT(*) FROM pokemon_collection;
```

### Daily activity (last 30 days)
```sql
SELECT DATE(created_at) AS day, COUNT(*) AS count
FROM answers
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day;
```

### Recent players
```sql
SELECT
  t.id, t.name,
  MAX(a.created_at) AS last_active,
  COUNT(a.id) AS total_answers,
  ROUND(100.0 * SUM(CASE WHEN a.correct THEN 1 ELSE 0 END) / COUNT(a.id)) AS correct_pct,
  (SELECT COUNT(*) FROM pokemon_collection pc WHERE pc.trainer_id = t.id) AS pokemon_count
FROM trainers t
JOIN answers a ON a.trainer_id = t.id
GROUP BY t.id
ORDER BY last_active DESC
LIMIT 10;
```

### Player detail stats
```sql
-- Basic stats
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END) AS correct,
  SUM(CASE WHEN NOT correct THEN 1 ELSE 0 END) AS wrong
FROM answers WHERE trainer_id = $1;

-- Daily activity (correct vs wrong)
SELECT
  DATE(created_at) AS day,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END) AS correct,
  SUM(CASE WHEN NOT correct THEN 1 ELSE 0 END) AS wrong
FROM answers
WHERE trainer_id = $1 AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY day;

-- Hardest tables (min 3 attempts)
SELECT factor_a, factor_b,
  ROUND(100.0 * SUM(CASE WHEN correct THEN 1 ELSE 0 END) / COUNT(*)) AS accuracy
FROM answers
WHERE trainer_id = $1
GROUP BY factor_a, factor_b
HAVING COUNT(*) >= 3
ORDER BY accuracy ASC
LIMIT 5;

-- Pokemon collection
SELECT pokeapi_id, nickname, level, is_active
FROM pokemon_collection
WHERE trainer_id = $1
ORDER BY caught_at;
```

## Technical Details

- **File:** `functions/admin.ts` — single Pages Function, exported as `onRequestGet`
- **Chart.js:** loaded from `https://cdn.jsdelivr.net/npm/chart.js` CDN
- **HTML generation:** template literal strings in the function — no templating library
- **Pokémon names:** resolved client-side from PokéAPI using the `pokeapi_id` stored in the collection, to avoid slowing down the server-side render
- **Styling:** inline `<style>` block in the generated HTML — clean/modern design as shown in mockups
- **No authentication:** the `/admin` route is unlisted, which is sufficient for personal use
