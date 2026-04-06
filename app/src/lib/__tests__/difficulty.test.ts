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
