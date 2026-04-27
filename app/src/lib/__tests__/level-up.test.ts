import { describe, it, expect } from "vitest";
import { applyXp, xpToNextLevel } from "@shared/types";

describe("xpToNextLevel", () => {
  it("returns 30 for level 1", () => {
    expect(xpToNextLevel(1)).toBe(30);
  });

  it("returns 270 for level 5", () => {
    expect(xpToNextLevel(5)).toBe(270);
  });

  it("returns 1020 for level 10", () => {
    expect(xpToNextLevel(10)).toBe(1020);
  });
});

describe("applyXp", () => {
  it("does not level up when below threshold", () => {
    const result = applyXp(5, 0, 100);
    expect(result.newLevel).toBe(5);
    expect(result.newXp).toBe(100);
    expect(result.leveledUp).toBe(false);
  });

  it("levels up exactly once when crossing threshold", () => {
    const result = applyXp(5, 200, 100);
    expect(result.newLevel).toBe(6);
    expect(result.newXp).toBe(300 - xpToNextLevel(5));
    expect(result.leveledUp).toBe(true);
  });

  it("cascades multiple level-ups in one call", () => {
    const result = applyXp(1, 0, 200);
    expect(result.newLevel).toBeGreaterThan(2);
    expect(result.leveledUp).toBe(true);
  });

  it("is idempotent for zero gained when already valid", () => {
    const result = applyXp(5, 100, 0);
    expect(result.newLevel).toBe(5);
    expect(result.newXp).toBe(100);
    expect(result.leveledUp).toBe(false);
  });

  it("migrates over-cap XP without gain (cascade-only)", () => {
    const result = applyXp(1, 1000, 0);
    expect(result.newLevel).toBeGreaterThan(1);
    expect(result.newXp).toBeLessThan(xpToNextLevel(result.newLevel));
    expect(result.leveledUp).toBe(true);
  });
});
