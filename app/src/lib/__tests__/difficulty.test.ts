import { describe, it, expect } from "vitest";
import { calculateScoreDelta, pickWeightedQuestion, buildDifficultyMap } from "../difficulty";
import {
  DIFFICULTY_WRONG_DELTA,
  DIFFICULTY_SLOW_DELTA,
  DIFFICULTY_MODERATE_DELTA,
  DIFFICULTY_FAST_DELTA,
  FAST_THRESHOLD_MS,
  SLOW_THRESHOLD_MS,
  DIFFICULTY_DEFAULT,
} from "@shared/types";

describe("calculateScoreDelta", () => {
  it("returns big increase for wrong answer", () => {
    expect(calculateScoreDelta(false, 5000)).toBe(DIFFICULTY_WRONG_DELTA);
  });

  it("returns small increase for correct but slow", () => {
    expect(calculateScoreDelta(true, SLOW_THRESHOLD_MS + 1)).toBe(DIFFICULTY_SLOW_DELTA);
  });

  it("returns small decrease for correct moderate speed", () => {
    const mid = Math.floor((FAST_THRESHOLD_MS + SLOW_THRESHOLD_MS) / 2);
    expect(calculateScoreDelta(true, mid)).toBe(DIFFICULTY_MODERATE_DELTA);
  });

  it("returns decrease for correct and fast", () => {
    expect(calculateScoreDelta(true, FAST_THRESHOLD_MS - 1)).toBe(DIFFICULTY_FAST_DELTA);
  });
});

describe("buildDifficultyMap", () => {
  it("returns default scores for all 100 multiplications when empty", () => {
    const map = buildDifficultyMap([]);
    expect(map.size).toBe(100);
    expect(map.get("3x7")).toBe(DIFFICULTY_DEFAULT);
  });

  it("uses stored scores when provided", () => {
    const map = buildDifficultyMap([
      { id: 1, trainer_id: 1, factor_a: 7, factor_b: 8, score: 85, updated_at: "" },
    ]);
    expect(map.get("7x8")).toBe(85);
    expect(map.get("3x4")).toBe(DIFFICULTY_DEFAULT);
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
