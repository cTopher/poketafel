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

  const stats: OverviewStats = {
    totalTrainers:
      (totalTrainers[0] as { count: number } | undefined)?.count ?? 0,
    activeWeek: (activeWeek[0] as { count: number } | undefined)?.count ?? 0,
    answersWeek: (answersWeek[0] as { count: number } | undefined)?.count ?? 0,
    totalPokemon:
      (totalPokemon[0] as { count: number } | undefined)?.count ?? 0,
  };

  const html = overviewHtml(
    stats,
    dailyActivity as DailyRow[],
    recentPlayers as RecentPlayer[],
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Placeholder for Task 2
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderDetailPage(_env: Env, _trainerId: number): Response {
  return new Response("Not implemented", { status: 404 });
}

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
  correct_pct: number | null;
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
