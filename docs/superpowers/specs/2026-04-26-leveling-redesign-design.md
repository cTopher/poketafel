# Leveling & XP Redesign

**Date:** 2026-04-26
**Status:** Design — pending implementation

## Problem

The current leveling curve makes mid-game progress feel slow, starting levels are too low compared to canonical Pokémon games, and wild Pokémon don't have their own level — their HP scales off the *player's* level, which removes the "stronger foe" feel. We want progression that mirrors how an actual Pokémon game would handle leveling, scaled to fit a kids' multiplication-tables game.

## Goals

- Reach a "balanced canon-ish" XP curve: from the Lv5 starter, ~15 wins to Lv10 and ~50 wins to Lv20 (against same-level opponents).
- Give wild Pokémon their own level, so battle difficulty and XP rewards both scale with the foe.
- Start the starter at Lv5 (canon) and let caught Pokémon join the team at the level they were caught.
- Migrate existing players' XP onto the new curve without losing progress, by auto-leveling-up on next save.

## Non-Goals

- No changes to battle controls, question generation, difficulty algorithm, or evolution logic.
- No server-side evolution (evolutions remain client-only and trigger on the next post-migration battle).
- No SQL schema migration — values change, columns don't.

## Design

### XP curve

```
xpToNextLevel(level) = 20 + 10 × level²
```

| Level | XP to next |
|-------|-----------:|
| 1 → 2 | 30 |
| 2 → 3 | 60 |
| 5 → 6 | 270 |
| 10 → 11 | 1020 |
| 20 → 21 | 4020 |

Quadratic shape: early levels fly, later ones earn a sense of progress, no runaway cubic explosion.

### XP gain (hybrid, level-scaled)

```
XP_PER_CORRECT      = 5             // per correct answer in battle
XP_WIN_PER_LEVEL    = 12            // multiplied by wild's level on win/catch
```

- Each correct answer: +5 XP.
- Win or successful catch: + `12 × wildLevel` XP bonus (in addition to per-correct XP already accumulated).
- Loss: 0 XP (unchanged).

**Tuning check** (assuming ~5–6 correct answers per win):

| Player Lv | Wild Lv | XP/win | xpToNext | Wins to next |
|----------:|--------:|-------:|---------:|-------------:|
| 5 | 5 | 5×5 + 60 = 85 | 270 | ~3 |
| 10 | 10 | 6×5 + 120 = 150 | 1020 | ~7 |
| 20 | 20 | 7×5 + 240 = 275 | 4020 | ~15 |

Cumulative: Lv5→10 ≈ 15 wins, Lv5→20 ≈ 50 wins ✓.

### Wild Pokémon level

Wild Pokémon now have their own level, picked uniformly in a ±2 range around the active player Pokémon's level, clamped to ≥1.

```ts
function pickWildLevel(playerLevel: number): number {
  const offset = randomInt(-2, 2);  // inclusive
  return Math.max(1, playerLevel + offset);
}
```

- Computed once when the battle starts; persists for the full battle.
- Stored on `WildPokemon` (new `level: number` field).
- Drives wild HP, wild damage, and XP reward.

### Stats from level (symmetric: player and wild use the same formula)

```
HP(L)     = 50 + 5 × (L - 1)
damage(L) = 10 + 1 × (L - 1)
```

- Wild HP no longer derives from player level.
- Wrong-answer damage is now the wild's per-level damage (a Lv1 wild still hits for 10, so early-game feel is unchanged).
- `FLAT_DAMAGE` constant is removed.

### Starting levels

- **Starter:** Lv5 with 0 XP. `StarterSelectScreen.onSelect` passes `level: 5` to `api.catchPokemon`.
- **Caught Pokémon:** join at the wild's level at the moment of catch, with 0 XP. `useBattle.handleCatch` passes `level: wildPokemon.level` to `api.catchPokemon`.
- Schema default stays `level INT NOT NULL DEFAULT 1`. The API accepts an optional `level` and overrides on insert when provided.

### Level-up cascade

A single battle can now produce multiple level-ups (especially after migration). Replaces the single-branch logic at `App.handleBattleEnd`.

```ts
function applyXp(level: number, xp: number, gained: number) {
  let newLevel = level;
  let newXp    = xp + gained;
  while (newXp >= xpToNextLevel(newLevel)) {
    newXp -= xpToNextLevel(newLevel);
    newLevel++;
  }
  return { newLevel, newXp, leveledUp: newLevel > level };
}
```

- After the cascade, `checkEvolution` runs once with the *final* `newLevel` — handles Pokémon that skip past their evolution threshold in a single battle.
- Result screen shows the highest level reached.

### Migration: auto-level-up on next save

No SQL migration. The same cascade runs server-side on `GET /api/save`:

- For each Pokémon in the loaded collection, run `while (xp >= xpToNextLevel(level)) { xp -= xpToNextLevel(level); level++; }`.
- If any rows changed, write back new `level`/`xp` values before returning the collection.
- Server reuses `xpToNextLevel` from `shared/types.ts`.
- Idempotent: subsequent loads find nothing to migrate.

**First load post-deploy:** existing players' over-cap XP cashes in to levels automatically — no battle required, no manual SQL.

**Evolution after auto-level:** the server cascade does *not* trigger evolutions (evolution requires PokéAPI fetches and is client-side). Pending evolutions trigger on the next post-migration battle via the standard cascade-then-`checkEvolution` flow. Acceptable because evolution is a celebratory animation that fits naturally at battle end.

## Files affected

| File | Change |
|------|--------|
| `shared/types.ts` | New `XP_WIN_PER_LEVEL`; updated `XP_PER_CORRECT`; new `xpToNextLevel`; remove `FLAT_DAMAGE`, `WILD_HP_BASE`, `WILD_HP_PER_PLAYER_LEVEL`, `XP_PER_WIN`. Add `level: number` to `WildPokemon`. |
| `app/src/lib/battle-engine.ts` | New `getWildStats(level)`, new `pickWildLevel(playerLevel)`. `createBattle` uses wild stats from wild level. `submitAnswer` / `attemptCatch` / `applyFreeDamage` use wild damage instead of `FLAT_DAMAGE`. Win/catch XP bonus scales with `wild.level`. |
| `app/src/lib/__tests__/battle-engine.test.ts` | Update existing tests to construct wilds with explicit levels; add tests for wild stats by level, XP scaling, win bonus by level. |
| `app/src/screens/BattleScreen.tsx` (or wherever the wild is constructed) | Call `pickWildLevel(activePokemon.level)` and attach `level` to the `WildPokemon`. |
| `app/src/hooks/useBattle.ts` | `handleCatch` passes `level: wildPokemon.level` to `api.catchPokemon`. |
| `app/src/screens/StarterSelectScreen.tsx` (via `App.tsx` `onSelect`) | Passes `level: 5` to `api.catchPokemon`. |
| `app/src/lib/api-client.ts` | `catchPokemon` request type gains optional `level`. |
| `app/src/App.tsx` | `handleBattleEnd` uses cascade `applyXp`; runs `checkEvolution` with final level. |
| `functions/api/pokemon.ts` | Catch handler accepts optional `level` in body; inserts it (default 1 if omitted). |
| `functions/api/save.ts` | Server-side migration cascade per Pokémon; writes back updated `level`/`xp`. |

## Risks & open edges

- **Inactive Pokémon don't earn XP.** Unchanged from current behavior; spec confirms this is intended.
- **Migration cascade could level a Pokémon past its evolution threshold without evolving** (server-side cascade has no PokéAPI access). Mitigation: next battle's cascade-then-`checkEvolution` triggers it. Players see one delayed evolution after migration; acceptable.
- **Wild Lv1 vs player Lv5+** (when the ±2 clamp kicks in): wild has only 50 HP / 10 dmg, easy win. Acceptable — symmetric with how route-low encounters feel in canon.
- **Test churn:** existing battle-engine tests assume `FLAT_DAMAGE`. Updating them is mechanical but unavoidable.

## Success criteria

- A new trainer's starter is Lv5 from the start.
- Caught Pokémon's `level` matches the wild's level at the moment of catch.
- A fresh Lv5 Pokémon levels to Lv10 in ~15 wins (±20%) against same-level opponents.
- Wild HP and damage match the symmetric formula based on wild level.
- An existing player loads the app post-deploy, sees `getCollection` return migrated `level`/`xp`, and any "owed" levels are applied without a battle.
- All existing tests pass after updates; new tests cover wild-level stats and level-scaled XP.
