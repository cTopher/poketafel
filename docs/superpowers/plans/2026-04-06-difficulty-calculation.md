# Difficulty Calculation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the running-total difficulty score with a rolling average of the last 5 answers (past month) per multiplication.

**Architecture:** The backend (`battle.ts`) computes the new score entirely in SQL after inserting an answer — fetching up to 5 recent answers, scoring each one, averaging, and upserting into the `difficulty` table. The frontend stops computing deltas locally and just uses the `new_score` from the API response.

**Tech Stack:** PostgreSQL (Neon), React, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-06-difficulty-calculation-design.md`

---

### Task 1: Update shared constants

**Files:**
- Modify: `shared/types.ts:139-148`

- [ ] **Step 1: Remove unused constants and update default**

Replace lines 139-148 in `shared/types.ts`:

```typescript
// ── Difficulty constants ──

export const DIFFICULTY_DEFAULT = 50;
export const DIFFICULTY_MIN = 5;
export const DIFFICULTY_WRONG_DELTA = 15;
export const DIFFICULTY_SLOW_DELTA = 3;
export const DIFFICULTY_MODERATE_DELTA = -1;
export const DIFFICULTY_FAST_DELTA = -5;
export const SLOW_THRESHOLD_MS = 10000;
export const FAST_THRESHOLD_MS = 4000;
```

With:

```typescript
// ── Difficulty constants ──

export const DIFFICULTY_DEFAULT = 20;
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "refactor: simplify difficulty constants, change default to 20"
```

---

### Task 2: Update backend score calculation

**Files:**
- Modify: `functions/api/battle.ts`

- [ ] **Step 1: Replace delta-based calculation with rolling average query**

Replace the full contents of `functions/api/battle.ts` with:

```typescript
import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type {
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from "../../shared/types";
import { DIFFICULTY_DEFAULT } from "../../shared/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const body = (await context.request.json()) as SubmitAnswerRequest;
  const { factor_a, factor_b, given_answer, time_ms } = body;
  const correctAnswer = factor_a * factor_b;
  const correct = given_answer === correctAnswer;

  const sql = getDb(context.env);

  await sql`
    INSERT INTO answers (trainer_id, factor_a, factor_b, given_answer, correct, time_ms)
    VALUES (${trainerId}, ${factor_a}, ${factor_b}, ${given_answer}, ${correct}, ${time_ms})
  `;

  const scoreResult = await sql`
    WITH recent AS (
      SELECT correct, time_ms
      FROM answers
      WHERE trainer_id = ${trainerId}
        AND factor_a = ${factor_a}
        AND factor_b = ${factor_b}
        AND created_at >= NOW() - INTERVAL '1 month'
      ORDER BY created_at DESC
      LIMIT 5
    ),
    scored AS (
      SELECT
        CASE
          WHEN NOT correct THEN 30
          ELSE LEAST(20, GREATEST(1, ROUND(time_ms / 1000.0)))
        END AS score
      FROM recent
    )
    SELECT ROUND(AVG(score))::int AS avg_score FROM scored
  `;

  const newScore = scoreResult[0]?.avg_score ?? DIFFICULTY_DEFAULT;

  await sql`
    INSERT INTO difficulty (trainer_id, factor_a, factor_b, score, updated_at)
    VALUES (${trainerId}, ${factor_a}, ${factor_b}, ${newScore}, NOW())
    ON CONFLICT (trainer_id, factor_a, factor_b)
    DO UPDATE SET
      score = ${newScore},
      updated_at = NOW()
  `;

  const response: SubmitAnswerResponse = {
    correct,
    correct_answer: correctAnswer,
    new_score: newScore as number,
  };

  return json(response);
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/battle.ts
git commit -m "feat: compute difficulty from rolling average of last 5 answers"
```

---

### Task 3: Clean up frontend difficulty module

**Files:**
- Modify: `app/src/lib/difficulty.ts`

- [ ] **Step 1: Remove `calculateScoreDelta` and `applyScoreDelta`**

Replace the full contents of `app/src/lib/difficulty.ts` with:

```typescript
import type { DifficultyRow, Question } from "@shared/types";
import { DIFFICULTY_DEFAULT } from "@shared/types";

export type DifficultyMap = Map<string, number>;

function key(a: number, b: number): string {
  return `${a}x${b}`;
}

export function buildDifficultyMap(rows: DifficultyRow[]): DifficultyMap {
  const map = new Map<string, number>();

  // Initialize all 100 multiplications with default
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      map.set(key(a, b), DIFFICULTY_DEFAULT);
    }
  }

  // Overlay stored scores
  for (const row of rows) {
    map.set(key(row.factor_a, row.factor_b), row.score);
  }

  return map;
}

export function setScore(
  map: DifficultyMap,
  factorA: number,
  factorB: number,
  score: number,
): void {
  map.set(key(factorA, factorB), score);
}

export function pickWeightedQuestion(
  map: DifficultyMap,
  retryQueue: Question[],
): Question {
  // Retry queue takes priority
  if (retryQueue.length > 0) {
    const first = retryQueue[0];
    if (first) return first;
  }

  // Weighted random selection
  const entries = Array.from(map.entries());
  const totalWeight = entries.reduce((sum, [, score]) => sum + score, 0);
  let roll = Math.random() * totalWeight;

  for (const [k, score] of entries) {
    roll -= score;
    if (roll <= 0) {
      const [factorA, factorB] = k.split("x").map(Number);
      return { factorA: factorA ?? 5, factorB: factorB ?? 5 };
    }
  }

  // Fallback (shouldn't happen)
  return { factorA: 5, factorB: 5 };
}

export function generateChoices(factorA: number, factorB: number): number[] {
  const correct = factorA * factorB;
  const candidates = new Set<number>();

  // Nearby factor products
  for (const da of [-1, 0, 1]) {
    for (const db of [-1, 0, 1]) {
      const a = factorA + da;
      const b = factorB + db;
      if (a >= 1 && b >= 1) {
        candidates.add(a * b);
      }
    }
  }

  // Off-by-small from correct
  for (const offset of [-2, -1, 1, 2]) {
    if (correct + offset >= 1) {
      candidates.add(correct + offset);
    }
  }

  // Remove the correct answer from candidates
  candidates.delete(correct);

  // Convert to array and shuffle
  let distractors = Array.from(candidates);

  // Fill with random values if not enough
  while (distractors.length < 5) {
    const rand = Math.max(1, correct + Math.floor(Math.random() * 41) - 20);
    if (rand !== correct && !distractors.includes(rand)) {
      distractors.push(rand);
    }
  }

  // Take 5 distractors, shuffled
  distractors = distractors.sort(() => Math.random() - 0.5).slice(0, 5);

  // Combine with correct answer and shuffle
  const choices = [correct, ...distractors];
  return choices.sort(() => Math.random() - 0.5);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/lib/difficulty.ts
git commit -m "refactor: remove calculateScoreDelta and applyScoreDelta, add setScore"
```

---

### Task 4: Update useBattle hook

**Files:**
- Modify: `app/src/hooks/useBattle.ts`

- [ ] **Step 1: Replace local delta calculation with API-driven score update**

Replace the imports from difficulty (lines 16-22):

```typescript
import {
  buildDifficultyMap,
  pickWeightedQuestion,
  calculateScoreDelta,
  applyScoreDelta,
  generateChoices,
  type DifficultyMap,
} from "../lib/difficulty";
```

With:

```typescript
import {
  buildDifficultyMap,
  pickWeightedQuestion,
  setScore,
  generateChoices,
  type DifficultyMap,
} from "../lib/difficulty";
```

Then replace the `handleAnswer` callback (lines 78-123). The key change: instead of computing a delta locally, await the API response and use `new_score` from it. Replace:

```typescript
  const handleAnswer = useCallback(
    (givenAnswer: number) => {
      const timeMs = Date.now() - answerStart;
      const { currentQuestion } = battle;
      const correct =
        givenAnswer === currentQuestion.factorA * currentQuestion.factorB;

      api
        .submitAnswer({
          factor_a: currentQuestion.factorA,
          factor_b: currentQuestion.factorB,
          given_answer: givenAnswer,
          time_ms: timeMs,
        })
        .catch(() => {});

      const delta = calculateScoreDelta(correct, timeMs);
      applyScoreDelta(
        difficultyMap,
        currentQuestion.factorA,
        currentQuestion.factorB,
        delta,
      );

      const nextRetryQueue = correct
        ? battle.retryQueue.filter(
            (q) =>
              !(
                q.factorA === currentQuestion.factorA &&
                q.factorB === currentQuestion.factorB
              ),
          )
        : battle.retryQueue;
      const nextQuestion = pickWeightedQuestion(difficultyMap, nextRetryQueue);

      const newState = submitAnswer(battle, givenAnswer, nextQuestion);
      setBattle(newState);

      // Generate new choices for the next question (stay in fight mode)
      setChoices(generateChoices(nextQuestion.factorA, nextQuestion.factorB));
      setAnswerStart(Date.now());

      return newState;
    },
    [battle, answerStart, difficultyMap],
  );
```

With:

```typescript
  const handleAnswer = useCallback(
    (givenAnswer: number) => {
      const timeMs = Date.now() - answerStart;
      const { currentQuestion } = battle;

      api
        .submitAnswer({
          factor_a: currentQuestion.factorA,
          factor_b: currentQuestion.factorB,
          given_answer: givenAnswer,
          time_ms: timeMs,
        })
        .then((res) => {
          setScore(
            difficultyMap,
            currentQuestion.factorA,
            currentQuestion.factorB,
            res.new_score,
          );
        })
        .catch(() => {});

      const correct =
        givenAnswer === currentQuestion.factorA * currentQuestion.factorB;

      const nextRetryQueue = correct
        ? battle.retryQueue.filter(
            (q) =>
              !(
                q.factorA === currentQuestion.factorA &&
                q.factorB === currentQuestion.factorB
              ),
          )
        : battle.retryQueue;
      const nextQuestion = pickWeightedQuestion(difficultyMap, nextRetryQueue);

      const newState = submitAnswer(battle, givenAnswer, nextQuestion);
      setBattle(newState);

      // Generate new choices for the next question (stay in fight mode)
      setChoices(generateChoices(nextQuestion.factorA, nextQuestion.factorB));
      setAnswerStart(Date.now());

      return newState;
    },
    [battle, answerStart, difficultyMap],
  );
```

- [ ] **Step 2: Commit**

```bash
git add app/src/hooks/useBattle.ts
git commit -m "refactor: use API-driven difficulty score instead of local delta"
```

---

### Task 5: Update tests

**Files:**
- Modify: `app/src/lib/__tests__/difficulty.test.ts`

- [ ] **Step 1: Remove `calculateScoreDelta` tests and update imports**

Replace the full contents of `app/src/lib/__tests__/difficulty.test.ts` with:

```typescript
import { describe, it, expect } from "vitest";
import {
  pickWeightedQuestion,
  buildDifficultyMap,
  generateChoices,
  setScore,
} from "../difficulty";
import { DIFFICULTY_DEFAULT } from "@shared/types";

describe("buildDifficultyMap", () => {
  it("returns default scores for all 100 multiplications when empty", () => {
    const map = buildDifficultyMap([]);
    expect(map.size).toBe(100);
    expect(map.get("3x7")).toBe(DIFFICULTY_DEFAULT);
  });

  it("uses stored scores when provided", () => {
    const map = buildDifficultyMap([
      {
        id: 1,
        trainer_id: 1,
        factor_a: 7,
        factor_b: 8,
        score: 85,
        updated_at: "",
      },
    ]);
    expect(map.get("7x8")).toBe(85);
    expect(map.get("3x4")).toBe(DIFFICULTY_DEFAULT);
  });
});

describe("setScore", () => {
  it("sets the score for a multiplication", () => {
    const map = buildDifficultyMap([]);
    setScore(map, 7, 8, 15);
    expect(map.get("7x8")).toBe(15);
  });
});

describe("pickWeightedQuestion", () => {
  it("returns a valid question from the map", () => {
    const map = buildDifficultyMap([]);
    const q = pickWeightedQuestion(map, []);
    expect(q.factorA).toBeGreaterThanOrEqual(1);
    expect(q.factorA).toBeLessThanOrEqual(10);
    expect(q.factorB).toBeGreaterThanOrEqual(1);
    expect(q.factorB).toBeLessThanOrEqual(10);
  });

  it("picks from retry queue first when non-empty", () => {
    const map = buildDifficultyMap([]);
    const retryQ = { factorA: 7, factorB: 8 };
    const q = pickWeightedQuestion(map, [retryQ]);
    expect(q).toEqual(retryQ);
  });
});

describe("generateChoices", () => {
  it("returns exactly 6 numbers", () => {
    const choices = generateChoices(3, 4);
    expect(choices).toHaveLength(6);
  });

  it("includes the correct answer", () => {
    const choices = generateChoices(7, 8);
    expect(choices).toContain(56);
  });

  it("has no duplicates", () => {
    const choices = generateChoices(5, 6);
    const unique = new Set(choices);
    expect(unique.size).toBe(6);
  });

  it("all values are positive integers", () => {
    const choices = generateChoices(1, 1);
    for (const c of choices) {
      expect(c).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(c)).toBe(true);
    }
  });

  it("generates plausible distractors near the correct answer", () => {
    const choices = generateChoices(6, 7);
    const correct = 42;
    for (const c of choices) {
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(correct + 30);
    }
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd app && npx vitest run src/lib/__tests__/difficulty.test.ts`
Expected: All tests pass.

- [ ] **Step 3: Run lint and format**

Run: `npm run lint:fix && npm run format && npm run lint && npm run format:check`
Expected: Zero errors or warnings.

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/__tests__/difficulty.test.ts
git commit -m "test: update difficulty tests for new scoring model"
```
