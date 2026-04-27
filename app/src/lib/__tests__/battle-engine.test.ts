import { describe, it, expect } from "vitest";
import {
  createBattle,
  submitAnswer,
  canThrowPokeball,
  getPlayerStats,
  attemptCatch,
  applyFreeDamage,
  getWildStats,
  pickWildLevel,
} from "../battle-engine";
import { XP_PER_CORRECT, XP_WIN_PER_LEVEL } from "@shared/types";
import type { OwnedPokemon, WildPokemon, Question } from "@shared/types";

const mockPlayer: OwnedPokemon = {
  id: 1,
  trainer_id: 1,
  pokeapi_id: 4,
  nickname: null,
  level: 5,
  xp: 0,
  is_active: true,
  caught_at: "",
};

const mockWild: WildPokemon = {
  pokeapiId: 16,
  name: "pidgey",
  spriteUrl: "",
  cryUrl: "",
  types: ["normal", "flying"],
  level: 5,
};

const mockQuestion: Question = { factorA: 7, factorB: 8 };

describe("createBattle", () => {
  it("creates a battle with correct HP values", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    expect(battle.status).toBe("active");
    expect(battle.playerHp).toBe(battle.playerMaxHp);
    expect(battle.wildHp).toBe(battle.wildMaxHp);
    expect(battle.currentQuestion).toEqual(mockQuestion);
  });

  it("uses player level for player HP", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    expect(battle.playerMaxHp).toBe(getPlayerStats(mockPlayer.level).maxHp);
  });

  it("uses wild level for wild HP", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    expect(battle.wildMaxHp).toBe(getWildStats(mockWild.level).maxHp);
  });

  it("initializes with mode 'menu'", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    expect(state.mode).toBe("menu");
  });
});

describe("submitAnswer", () => {
  it("deals player damage to wild on correct answer", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.turnResult?.correct).toBe(true);
    expect(result.wildHp).toBe(
      battle.wildMaxHp - getPlayerStats(mockPlayer.level).damage,
    );
  });

  it("awards XP_PER_CORRECT on a correct hit", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.xpGained).toBe(XP_PER_CORRECT);
  });

  it("deals wild damage to player on wrong answer", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 99, next);
    expect(result.turnResult?.correct).toBe(false);
    expect(result.playerHp).toBe(
      battle.playerMaxHp - getWildStats(mockWild.level).damage,
    );
    expect(result.retryQueue).toContainEqual(mockQuestion);
  });

  it("awards XP_PER_CORRECT plus XP_WIN_PER_LEVEL × wild.level on win", () => {
    let battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const playerStats = getPlayerStats(mockPlayer.level);
    battle = { ...battle, wildHp: playerStats.damage };
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.status).toBe("won");
    expect(result.xpGained).toBe(
      XP_PER_CORRECT + XP_WIN_PER_LEVEL * mockWild.level,
    );
  });

  it("scales win bonus by wild level", () => {
    const lvl10Wild: WildPokemon = { ...mockWild, level: 10 };
    let battle = createBattle(mockPlayer, lvl10Wild, mockQuestion);
    const playerStats = getPlayerStats(mockPlayer.level);
    battle = { ...battle, wildHp: playerStats.damage };
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.xpGained).toBe(XP_PER_CORRECT + XP_WIN_PER_LEVEL * 10);
  });

  it("sets status to lost when player hp reaches 0", () => {
    const wildDamage = getWildStats(mockWild.level).damage;
    let battle = createBattle(mockPlayer, mockWild, mockQuestion);
    battle = { ...battle, playerHp: wildDamage };
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 99, next);
    expect(result.status).toBe("lost");
    expect(result.xpGained).toBe(0);
  });
});

describe("canThrowPokeball", () => {
  it("returns true when wild HP is below threshold", () => {
    expect(canThrowPokeball(10, 100)).toBe(true);
  });

  it("returns false when wild HP is above threshold", () => {
    expect(canThrowPokeball(50, 100)).toBe(false);
  });
});

describe("attemptCatch", () => {
  it("deals wild damage on failed catch", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const before = state.playerHp;
    const after = attemptCatch(state, 999);
    expect(after.playerHp).toBe(before - getWildStats(mockWild.level).damage);
    expect(after.mode).toBe("menu");
  });

  it("sets status to caught and awards level-scaled XP on correct answer", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const after = attemptCatch(state, 56);
    expect(after.status).toBe("caught");
    expect(after.xpGained).toBe(XP_WIN_PER_LEVEL * mockWild.level);
  });
});

describe("applyFreeDamage", () => {
  it("reduces player HP by wild damage", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const before = state.playerHp;
    const after = applyFreeDamage(state);
    expect(after.playerHp).toBe(before - getWildStats(mockWild.level).damage);
    expect(after.mode).toBe("menu");
  });

  it("sets status to lost when HP reaches 0", () => {
    const state = {
      ...createBattle(mockPlayer, mockWild, mockQuestion),
      playerHp: 5,
    };
    const after = applyFreeDamage(state);
    expect(after.playerHp).toBe(0);
    expect(after.status).toBe("lost");
    expect(after.xpGained).toBe(0);
  });
});

describe("getWildStats", () => {
  it("returns base stats at level 1", () => {
    expect(getWildStats(1)).toEqual({ maxHp: 50, damage: 10 });
  });

  it("scales HP by 5 and damage by 1 per level", () => {
    expect(getWildStats(5)).toEqual({ maxHp: 70, damage: 14 });
    expect(getWildStats(10)).toEqual({ maxHp: 95, damage: 19 });
  });
});

describe("pickWildLevel", () => {
  it("stays within ±2 of player level", () => {
    for (let i = 0; i < 100; i++) {
      const level = pickWildLevel(10);
      expect(level).toBeGreaterThanOrEqual(8);
      expect(level).toBeLessThanOrEqual(12);
    }
  });

  it("clamps to minimum 1", () => {
    for (let i = 0; i < 100; i++) {
      const level = pickWildLevel(1);
      expect(level).toBeGreaterThanOrEqual(1);
      expect(level).toBeLessThanOrEqual(3);
    }
  });

  it("returns integer levels", () => {
    for (let i = 0; i < 50; i++) {
      const level = pickWildLevel(5);
      expect(Number.isInteger(level)).toBe(true);
    }
  });
});
