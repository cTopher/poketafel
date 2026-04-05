import type { DifficultyRow, Question } from "@shared/types";
import {
  DIFFICULTY_DEFAULT,
  DIFFICULTY_MIN,
  DIFFICULTY_WRONG_DELTA,
  DIFFICULTY_SLOW_DELTA,
  DIFFICULTY_MODERATE_DELTA,
  DIFFICULTY_FAST_DELTA,
  SLOW_THRESHOLD_MS,
  FAST_THRESHOLD_MS,
} from "@shared/types";

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

export function calculateScoreDelta(correct: boolean, timeMs: number): number {
  if (!correct) return DIFFICULTY_WRONG_DELTA;
  if (timeMs > SLOW_THRESHOLD_MS) return DIFFICULTY_SLOW_DELTA;
  if (timeMs > FAST_THRESHOLD_MS) return DIFFICULTY_MODERATE_DELTA;
  return DIFFICULTY_FAST_DELTA;
}

export function applyScoreDelta(map: DifficultyMap, factorA: number, factorB: number, delta: number): void {
  const k = key(factorA, factorB);
  const current = map.get(k) ?? DIFFICULTY_DEFAULT;
  map.set(k, Math.max(DIFFICULTY_MIN, current + delta));
}

export function pickWeightedQuestion(map: DifficultyMap, retryQueue: Question[]): Question {
  // Retry queue takes priority
  if (retryQueue.length > 0) {
    return retryQueue[0];
  }

  // Weighted random selection
  const entries = Array.from(map.entries());
  const totalWeight = entries.reduce((sum, [, score]) => sum + score, 0);
  let roll = Math.random() * totalWeight;

  for (const [k, score] of entries) {
    roll -= score;
    if (roll <= 0) {
      const [a, b] = k.split("x").map(Number);
      return { factorA: a, factorB: b };
    }
  }

  // Fallback (shouldn't happen)
  return { factorA: 5, factorB: 5 };
}
