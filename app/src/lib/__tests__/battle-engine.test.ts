import { describe, it, expect } from "vitest";
import { createBattle, submitAnswer, canThrowPokeball, getPlayerStats } from "../battle-engine";
import { FLAT_DAMAGE, CATCH_HP_THRESHOLD, PLAYER_BASE_HP, HP_PER_LEVEL } from "@shared/types";
import type { OwnedPokemon, WildPokemon, Question } from "@shared/types";

const mockPlayer: OwnedPokemon = {
  id: 1, trainer_id: 1, pokeapi_id: 4, nickname: null,
  level: 5, xp: 0, is_active: true, caught_at: "",
};

const mockWild: WildPokemon = {
  pokeapiId: 16, name: "pidgey", spriteUrl: "", cryUrl: "", types: ["normal", "flying"],
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
});

describe("submitAnswer", () => {
  it("deals damage to wild pokemon on correct answer", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.turnResult!.correct).toBe(true);
    expect(result.wildHp).toBe(battle.wildMaxHp - getPlayerStats(mockPlayer.level).damage);
  });

  it("deals damage to player on wrong answer and queues retry", () => {
    const battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 99, next);
    expect(result.turnResult!.correct).toBe(false);
    expect(result.playerHp).toBeLessThan(battle.playerMaxHp);
    expect(result.retryQueue).toContainEqual(mockQuestion);
  });

  it("sets status to won when wild hp reaches 0", () => {
    let battle = createBattle(mockPlayer, mockWild, mockQuestion);
    const stats = getPlayerStats(mockPlayer.level);
    battle = { ...battle, wildHp: stats.damage };
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 56, next);
    expect(result.status).toBe("won");
  });

  it("sets status to lost when player hp reaches 0", () => {
    let battle = createBattle(mockPlayer, mockWild, mockQuestion);
    battle = { ...battle, playerHp: FLAT_DAMAGE };
    const next = { factorA: 3, factorB: 4 };
    const result = submitAnswer(battle, 99, next);
    expect(result.status).toBe("lost");
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
