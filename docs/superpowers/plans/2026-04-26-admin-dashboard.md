# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a server-rendered admin dashboard at `/admin` showing player activity stats and per-player detail views.

**Architecture:** Single Cloudflare Pages Function (`functions/admin.ts`) that queries Neon Postgres and returns complete HTML pages. Chart.js from CDN handles trend charts client-side. The `trainer` query param switches between overview and detail views.

**Tech Stack:** Cloudflare Pages Functions, Neon Postgres (via `@neondatabase/serverless`), Chart.js (CDN), inline HTML/CSS.

**Spec:** `docs/superpowers/specs/2026-04-26-admin-dashboard-design.md`

---

## File Structure

- **Create:** `functions/admin.ts` — the admin Pages Function (route: `/admin`). Contains query logic, HTML generation for both overview and detail pages. Exports `onRequestGet`.

That's it — one file. All HTML/CSS is generated inline via template literals.

---

### Task 1: Overview Page — Stats and Recent Players Table

**Files:**

- Create: `functions/admin.ts`

- [ ] **Step 1: Create `functions/admin.ts` with the overview page**

This function queries for summary stats and recent players, then returns a full HTML page. Note: the function is at `functions/admin.ts` (not inside `api/`), so Cloudflare Pages routes it to `/admin`.

```ts
import { getDb, type Env } from "./api/_db";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const trainerId = url.searchParams.get("trainer");

  if (trainerId) {
    return renderDetailPage(context.env, parseInt(trainerId, 10));
  }
  return renderOverviewPage(context.env);
};

async function renderOverviewPage(env: Env): Promise<Response> {
  const sql = getDb(env);

  const [
    totalTrainers,
    activeWeek,
    answersWeek,
    totalPokemon,
    dailyActivity,
    recentPlayers,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM trainers`,
    sql`SELECT COUNT(DISTINCT trainer_id)::int AS count FROM answers WHERE created_at > NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS count FROM answers WHERE created_at > NOW() - INTERVAL '7 days'`,
    sql`SELECT COUNT(*)::int AS count FROM pokemon_collection`,
    sql`
        SELECT DATE(created_at) AS day, COUNT(*)::int AS count
        FROM answers
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day
      `,
    sql`
        SELECT
          t.id, t.name,
          MAX(a.created_at) AS last_active,
          COUNT(a.id)::int AS total_answers,
          ROUND(100.0 * SUM(CASE WHEN a.correct THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0))::int AS correct_pct,
          (SELECT COUNT(*)::int FROM pokemon_collection pc WHERE pc.trainer_id = t.id) AS pokemon_count
        FROM trainers t
        JOIN answers a ON a.trainer_id = t.id
        GROUP BY t.id
        ORDER BY MAX(a.created_at) DESC
        LIMIT 10
      `,
  ]);

  const stats = {
    totalTrainers: totalTrainers[0]?.count ?? 0,
    activeWeek: activeWeek[0]?.count ?? 0,
    answersWeek: answersWeek[0]?.count ?? 0,
    totalPokemon: totalPokemon[0]?.count ?? 0,
  };

  const html = overviewHtml(stats, dailyActivity, recentPlayers);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Placeholder for Task 2
async function renderDetailPage(
  env: Env,
  trainerId: number,
): Promise<Response> {
  return new Response("Not implemented", { status: 404 });
}
```

- [ ] **Step 2: Add the `overviewHtml` function**

Below `renderOverviewPage` in the same file, add the HTML template function. This generates the full HTML page with embedded data for Chart.js.

```ts
interface OverviewStats {
  totalTrainers: number;
  activeWeek: number;
  answersWeek: number;
  totalPokemon: number;
}

interface DailyRow {
  day: string;
  count: number;
}

interface RecentPlayer {
  id: number;
  name: string;
  last_active: string;
  total_answers: number;
  correct_pct: number;
  pokemon_count: number;
}

function overviewHtml(
  stats: OverviewStats,
  daily: DailyRow[],
  players: RecentPlayer[],
): string {
  const playerRows = players
    .map(
      (p) => `
      <tr>
        <td><a class="trainer-link" href="/admin?trainer=${p.id}">${escapeHtml(p.name)}</a></td>
        <td>${timeAgo(p.last_active)}</td>
        <td>${p.total_answers}</td>
        <td>${p.correct_pct ?? 0}%</td>
        <td>${p.pokemon_count}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pokétafel Admin</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
${sharedStyles()}
</head>
<body>
  <div class="header">
    <div>
      <h1>Pokétafel Admin</h1>
      <div class="subtitle">Player activity dashboard</div>
    </div>
  </div>

  <div class="stats-grid">
    ${statCard("Total Trainers", stats.totalTrainers)}
    ${statCard("Active This Week", stats.activeWeek)}
    ${statCard("Answers This Week", stats.answersWeek)}
    ${statCard("Pokémon Caught", stats.totalPokemon)}
  </div>

  <div class="section">
    <h2>Daily Activity (Last 30 Days)</h2>
    <canvas id="dailyChart" height="80"></canvas>
  </div>

  <div class="section">
    <h2>Recent Players</h2>
    <table>
      <thead>
        <tr>
          <th>Trainer</th>
          <th>Last Active</th>
          <th>Total Answers</th>
          <th>Correct %</th>
          <th>Pokémon</th>
        </tr>
      </thead>
      <tbody>${playerRows}</tbody>
    </table>
  </div>

  <script>
    const dailyData = ${JSON.stringify(daily)};
    new Chart(document.getElementById('dailyChart'), {
      type: 'bar',
      data: {
        labels: dailyData.map(d => d.day),
        datasets: [{
          label: 'Answers',
          data: dailyData.map(d => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  </script>
</body>
</html>`;
}
```

- [ ] **Step 3: Add shared helper functions**

Add these helpers above the HTML template functions in the same file:

```ts
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statCard(
  label: string,
  value: number | string,
  extra?: string,
): string {
  return `
    <div class="stat-card">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      ${extra ? `<div class="sub">${extra}</div>` : ""}
    </div>`;
}

function sharedStyles(): string {
  return `<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; padding: 24px; max-width: 960px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .header h1 { font-size: 22px; font-weight: 700; }
  .subtitle { color: #666; font-size: 14px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .stat-card .label { font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 6px; }
  .stat-card .value { font-size: 28px; font-weight: 700; }
  .stat-card .value.green { color: #22c55e; }
  .stat-card .value.red { color: #ef4444; }
  .stat-card .sub { font-size: 12px; color: #888; margin-top: 4px; }
  .section { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 20px; }
  .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px; border-bottom: 1px solid #f0f0f0; }
  tr:hover td { background: #f8f9fa; }
  .trainer-link { color: #3b82f6; text-decoration: none; font-weight: 500; }
  .trainer-link:hover { text-decoration: underline; }
  .back-link { color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block; margin-bottom: 16px; }
  .back-link:hover { text-decoration: underline; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .difficulty-bar { height: 8px; border-radius: 4px; background: #e5e7eb; overflow: hidden; }
  .difficulty-fill { height: 100%; border-radius: 4px; }
  .difficulty-fill.hard { background: #ef4444; }
  .difficulty-fill.medium { background: #f59e0b; }
  .difficulty-fill.easy { background: #22c55e; }
  .pokemon-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .pokemon-item { background: #f8f9fa; border-radius: 8px; padding: 8px 12px; font-size: 13px; }
  .pokemon-item.active { background: #e8f4fd; border: 1px solid #3b82f6; }
  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .two-col { grid-template-columns: 1fr; }
  }
</style>`;
}
```

- [ ] **Step 4: Test locally**

Run: `npm run dev:functions`

Open: `http://localhost:8788/admin`

Expected: The overview page renders with stat cards, a daily activity bar chart, and the recent players table. If the database has no data yet, the page should still render with zeros and an empty table.

- [ ] **Step 5: Commit**

```bash
git add functions/admin.ts
git commit -m "feat(admin): add overview page with stats, chart, and recent players"
```

---

### Task 2: Player Detail Page

**Files:**

- Modify: `functions/admin.ts` — replace `renderDetailPage` placeholder, add `detailHtml`

- [ ] **Step 1: Implement `renderDetailPage`**

Replace the placeholder `renderDetailPage` function in `functions/admin.ts`:

```ts
async function renderDetailPage(
  env: Env,
  trainerId: number,
): Promise<Response> {
  const sql = getDb(env);

  const [trainerRows, statsRows, dailyRows, hardestRows, collectionRows] =
    await Promise.all([
      sql`SELECT id, name, favorite_num, created_at FROM trainers WHERE id = ${trainerId}`,
      sql`
        SELECT
          COUNT(*)::int AS total,
          SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int AS correct,
          SUM(CASE WHEN NOT correct THEN 1 ELSE 0 END)::int AS wrong
        FROM answers WHERE trainer_id = ${trainerId}
      `,
      sql`
        SELECT
          DATE(created_at) AS day,
          SUM(CASE WHEN correct THEN 1 ELSE 0 END)::int AS correct,
          SUM(CASE WHEN NOT correct THEN 1 ELSE 0 END)::int AS wrong
        FROM answers
        WHERE trainer_id = ${trainerId} AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day
      `,
      sql`
        SELECT factor_a, factor_b,
          ROUND(100.0 * SUM(CASE WHEN correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0))::int AS accuracy
        FROM answers
        WHERE trainer_id = ${trainerId}
        GROUP BY factor_a, factor_b
        HAVING COUNT(*) >= 3
        ORDER BY accuracy ASC
        LIMIT 5
      `,
      sql`
        SELECT pokeapi_id, nickname, level, is_active
        FROM pokemon_collection
        WHERE trainer_id = ${trainerId}
        ORDER BY caught_at
      `,
    ]);

  if (trainerRows.length === 0) {
    return new Response("Trainer not found", { status: 404 });
  }

  const trainer = trainerRows[0] as {
    id: number;
    name: string;
    favorite_num: number;
    created_at: string;
  };
  const answerStats = (statsRows[0] as {
    total: number;
    correct: number;
    wrong: number;
  }) ?? {
    total: 0,
    correct: 0,
    wrong: 0,
  };

  const html = detailHtml(
    trainer,
    answerStats,
    dailyRows,
    hardestRows,
    collectionRows,
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Add the `detailHtml` function**

Add below `renderDetailPage`:

```ts
interface TrainerInfo {
  id: number;
  name: string;
  favorite_num: number;
  created_at: string;
}

interface AnswerStats {
  total: number;
  correct: number;
  wrong: number;
}

interface DailyDetail {
  day: string;
  correct: number;
  wrong: number;
}

interface HardestTable {
  factor_a: number;
  factor_b: number;
  accuracy: number;
}

interface PokemonRow {
  pokeapi_id: number;
  nickname: string | null;
  level: number;
  is_active: boolean;
}

function detailHtml(
  trainer: TrainerInfo,
  stats: AnswerStats,
  daily: DailyDetail[],
  hardest: HardestTable[],
  pokemon: PokemonRow[],
): string {
  const correctPct =
    stats.total > 0 ? Math.round((100 * stats.correct) / stats.total) : 0;
  const wrongPct = stats.total > 0 ? 100 - correctPct : 0;

  const joinDate = new Date(trainer.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hardestRows = hardest
    .map((h) => {
      const cls =
        h.accuracy < 50 ? "hard" : h.accuracy < 65 ? "medium" : "easy";
      return `
      <tr>
        <td>${h.factor_a} &times; ${h.factor_b}</td>
        <td>${h.accuracy}%</td>
        <td><div class="difficulty-bar"><div class="difficulty-fill ${cls}" style="width:${h.accuracy}%"></div></div></td>
      </tr>`;
    })
    .join("");

  const pokemonItems = pokemon
    .map(
      (p) =>
        `<div class="pokemon-item${p.is_active ? " active" : ""}" data-pokeapi-id="${p.pokeapi_id}">${p.nickname ?? `<span class="pokemon-name" data-id="${p.pokeapi_id}">...</span>`} <span class="level">Lv.${p.level}</span></div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(trainer.name)} — Pokétafel Admin</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
${sharedStyles()}
</head>
<body>
  <a class="back-link" href="/admin">&larr; Back to overview</a>

  <div class="header">
    <div>
      <h1>${escapeHtml(trainer.name)}</h1>
      <div class="subtitle">Joined ${joinDate} · Favorite number: ${trainer.favorite_num}</div>
    </div>
  </div>

  <div class="stats-grid">
    ${statCard("Total Answers", stats.total)}
    ${statCard("Correct", stats.correct, `${correctPct}%`).replace('class="value"', 'class="value green"')}
    ${statCard("Wrong", stats.wrong, `${wrongPct}%`).replace('class="value"', 'class="value red"')}
    ${statCard("Pokémon Caught", pokemon.length)}
  </div>

  <div class="section">
    <h2>Daily Activity (Last 30 Days)</h2>
    <canvas id="dailyChart" height="80"></canvas>
  </div>

  <div class="two-col">
    <div class="section">
      <h2>Hardest Tables</h2>
      ${
        hardest.length > 0
          ? `<table>
        <thead><tr><th>Table</th><th>Accuracy</th><th></th></tr></thead>
        <tbody>${hardestRows}</tbody>
      </table>`
          : "<p class='subtitle'>Not enough data yet</p>"
      }
    </div>
    <div class="section">
      <h2>Pokémon Collection</h2>
      <div class="pokemon-grid">${pokemonItems || "<p class='subtitle'>No Pokémon yet</p>"}</div>
    </div>
  </div>

  <script>
    const dailyData = ${JSON.stringify(daily)};
    new Chart(document.getElementById('dailyChart'), {
      type: 'bar',
      data: {
        labels: dailyData.map(d => d.day),
        datasets: [
          {
            label: 'Correct',
            data: dailyData.map(d => d.correct),
            backgroundColor: 'rgba(34, 197, 94, 0.7)',
            borderRadius: 4,
          },
          {
            label: 'Wrong',
            data: dailyData.map(d => d.wrong),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });

    // Resolve pokemon names from PokeAPI
    document.querySelectorAll('.pokemon-name[data-id]').forEach(async (el) => {
      const id = el.getAttribute('data-id');
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
        const data = await res.json();
        el.textContent = data.name;
      } catch {
        el.textContent = 'pokemon #' + id;
      }
    });
  </script>
</body>
</html>`;
}
```

- [ ] **Step 3: Test locally**

Run: `npm run dev:functions`

Open: `http://localhost:8788/admin`

Expected: Overview page renders. Click a trainer name — navigates to `/admin?trainer=<id>` and shows the detail page with correct/wrong chart, hardest tables, and Pokémon collection. Pokémon names resolve after a brief "..." flash.

Test edge case: `http://localhost:8788/admin?trainer=99999` — should return 404 "Trainer not found".

- [ ] **Step 4: Commit**

```bash
git add functions/admin.ts
git commit -m "feat(admin): add player detail page with accuracy, hardest tables, and collection"
```

---

### Task 3: Lint, Format, and Final Verification

**Files:**

- Modify: `functions/admin.ts` (if lint/format finds issues)

- [ ] **Step 1: Run lint and format**

```bash
npm run lint:fix && npm run format
```

Fix any issues that auto-fix doesn't catch.

- [ ] **Step 2: Run lint and format checks**

```bash
npm run lint && npm run format:check
```

Expected: Zero errors and warnings.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: No type errors.

- [ ] **Step 4: Test the full flow one more time**

Run: `npm run dev:functions`

1. Open `http://localhost:8788/admin` — overview with stats, chart, table
2. Click a trainer — detail page with all sections
3. Click "Back to overview" — returns to overview

- [ ] **Step 5: Commit any lint/format fixes**

```bash
git add functions/admin.ts
git commit -m "chore(admin): fix lint and formatting"
```

(Skip if no changes needed.)
