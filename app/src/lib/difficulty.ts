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
