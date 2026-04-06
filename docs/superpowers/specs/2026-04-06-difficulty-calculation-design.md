# Difficulty Calculation Redesign

## Summary

Replace the running-total difficulty score with a calculation based on the last 5 answers (up to 4 historical + the new answer) for each multiplication, from the past month. This makes the score reflect recent performance rather than all-time cumulative history.

## Scoring Rules

Each answer gets an individual score:

- **Wrong answer:** 30
- **Correct answer:** response time in seconds, clamped to [1, 20]
  - Formula: `LEAST(20, GREATEST(1, ROUND(time_ms / 1000.0)))`

The difficulty for a multiplication is `ROUND(AVG(individual_scores))` across the last 5 answers within the past month.

**Default difficulty** (no history): 20.

Score range: 1–30.

## Backend Changes: `functions/api/battle.ts`

After inserting the new answer into the `answers` table, run a single SQL query that:

1. Selects the last 5 answers for this `(trainer_id, factor_a, factor_b)` where `created_at >= NOW() - INTERVAL '1 month'`
2. Computes each row's score: wrong → 30, correct → `LEAST(20, GREATEST(1, ROUND(time_ms / 1000.0)))`
3. Takes `ROUND(AVG(score))` as the new difficulty
4. Upserts this value into the `difficulty` table

Remove the delta-based calculation logic currently in `battle.ts`.

## Frontend Changes: `app/src/lib/difficulty.ts`

- **Remove:** `calculateScoreDelta`, `applyScoreDelta` (dead code with new approach)
- **Keep:** `buildDifficultyMap` (update default from 50 to 20), `pickWeightedQuestion`, `generateChoices`

## Frontend Changes: `app/src/hooks/useBattle.ts`

- Stop calling `applyScoreDelta` locally
- Set the difficulty map entry directly from the `new_score` returned by the API

## Shared Types: `shared/types.ts`

- **Remove constants:** `DIFFICULTY_WRONG_DELTA`, `DIFFICULTY_SLOW_DELTA`, `DIFFICULTY_MODERATE_DELTA`, `DIFFICULTY_FAST_DELTA`, `SLOW_THRESHOLD_MS`, `FAST_THRESHOLD_MS`, `DIFFICULTY_MIN`
- **Update:** `DIFFICULTY_DEFAULT` from 50 to 20

## Tests: `app/src/lib/__tests__/difficulty.test.ts`

- Remove tests for `calculateScoreDelta` and `applyScoreDelta`
- Update tests that reference the old default of 50 to use 20
