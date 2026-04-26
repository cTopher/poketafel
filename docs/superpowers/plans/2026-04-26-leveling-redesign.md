# Leveling & XP Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current XP curve with a quadratic, level-scaled hybrid system; give wild Pokémon their own level (player level ±2); start the starter at Lv5 and have caught Pokémon join at the wild's level; auto-migrate existing players' over-cap XP into level-ups on the next save.

**Architecture:** Constants and the `xpToNextLevel`/`applyXp` helpers live in `shared/types.ts` (already imported by both client and Cloudflare Pages Functions). The battle engine gains symmetric per-level wild stats and a `pickWildLevel(playerLevel)` helper. The client cascades level-ups in `App.handleBattleEnd`; the server runs the same cascade on `GET /api/save` to migrate over-cap XP for existing players.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, Cloudflare Pages Functions, Neon Postgres.

---

## File Structure

| File | Role | Change type |
|------|------|-------------|
| `shared/types.ts` | XP constants, `xpToNextLevel`, new `applyXp` helper, `WildPokemon.level` | Modify |
| `app/src/lib/battle-engine.ts` | Battle math; new `getWildStats`, `pickWildLevel`; uses wild's per-level damage and level-scaled XP | Modify |
| `app/src/lib/__tests__/battle-engine.test.ts` | Existing tests; add cases for wild level, level-scaled XP | Modify |
| `app/src/screens/BattleScreen.tsx` | Constructs `WildPokemon`; pick wild level, display on nameplate | Modify |
| `app/src/hooks/useBattle.ts` | `handleCatch` passes wild level to `catchPokemon` | Modify |
| `app/src/lib/api-client.ts` | `catchPokemon` request type gains optional `level` | Modify |
| `app/src/App.tsx` | `handleBattleEnd` uses cascade + final-level evolution; starter onSelect passes `level: 5` | Modify |
| `functions/api/pokemon.ts` | POST accepts optional `level`; inserts when present | Modify |
| `functions/api/save.ts` | Server-side cascade migrates over-cap XP per Pokémon | Modify |

---

## Task 1: Update shared types and constants

**Files:**

- Modify: `shared/types.ts`

- [ ] **Step 1: Add `level` to `WildPokemon`**

Edit `shared/types.ts` to add `level: number` to the interface:

```typescript
export interface WildPokemon {
  pokeapiId: number;
  name: string;
  spriteUrl: string;
  cryUrl: string;
  types: string[];
  level: number;
}
```

- [ ] **Step 2: Replace progression constants and curve**

In `shared/types.ts`, replace the `// ── Progression constants ──` section and `xpToNextLevel` function with:

```typescript
// ── Progression constants ──

export const PLAYER_BASE_HP = 50;
export const HP_PER_LEVEL = 5;
export const DAMAGE_BASE = 10;
export const DAMAGE_PER_LEVEL = 1;

export const XP_PER_CORRECT = 5;
export const XP_WIN_PER_LEVEL = 12;

export const CATCH_HP_THRESHOLD = 0.25;

export function xpToNextLevel(level: number): number {
  return 20 + 10 * level * level;
}

export function applyXp(
  level: number,
  xp: number,
  gained: number,
): { newLevel: number; newXp: number; leveledUp: boolean } {
  let newLevel = level;
  let newXp = xp + gained;
  while (newXp >= xpToNextLevel(newLevel)) {
    newXp -= xpToNextLevel(newLevel);
    newLevel++;
  }
  return { newLevel, newXp, leveledUp: newLevel > level };
}
```

This removes (by omission): `FLAT_DAMAGE`, `WILD_HP_BASE`, `WILD_HP_PER_PLAYER_LEVEL`, `XP_PER_WIN`. It also renames `FLAT_DAMAGE`-style constants to `DAMAGE_BASE`/`DAMAGE_PER_LEVEL` for symmetry (they're used for both player and wild).

- [ ] **Step 3: Verify file compiles in isolation**

Run: `npx tsc --noEmit shared/types.ts`

Expected: no errors from `shared/types.ts` itself. (Other files will still fail until their tasks complete; that's expected.)

- [ ] **Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat(shared): redesign XP curve and add level/applyXp helpers"
```

---

## Task 2: Add tests for `applyXp` cascade

**Files:**

- Test: `app/src/lib/__tests__/level-up.test.ts` (create)

- [ ] **Step 1: Write the failing tests**

Create `app/src/lib/__tests__/level-up.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — they should pass already**

Run: `npm test --workspace=app -- level-up`

Expected: PASS — `applyXp` and `xpToNextLevel` are already defined in Task 1, so this is verifying behavior, not driving implementation. If any test fails, fix `shared/types.ts` until they pass.

- [ ] **Step 3: Commit**

```bash
git add app/src/lib/__tests__/level-up.test.ts
git commit -m "test: cover xpToNextLevel and applyXp cascade"
```

---

## Task 3: Implement `getWildStats` and `pickWildLevel`

**Files:**

- Modify: `app/src/lib/battle-engine.ts`
- Test: `app/src/lib/__tests__/battle-engine.test.ts`

- [ ] **Step 1: Write failing tests for `getWildStats`**

Add to the top of `app/src/lib/__tests__/battle-engine.test.ts` imports:

```typescript
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
```

Add a new describe block at the end of the file:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --workspace=app -- battle-engine`

Expected: FAIL with "getWildStats is not a function" / "pickWildLevel is not a function".

- [ ] **Step 3: Implement `getWildStats` and `pickWildLevel`**

Edit `app/src/lib/battle-engine.ts`. Replace the existing `getPlayerStats` and `getWildMaxHp` block (top of file) with:

```typescript
import type {
  BattleState,
  OwnedPokemon,
  WildPokemon,
  Question,
  TurnResult,
} from "@shared/types";
import {
  PLAYER_BASE_HP,
  HP_PER_LEVEL,
  DAMAGE_BASE,
  DAMAGE_PER_LEVEL,
  CATCH_HP_THRESHOLD,
  XP_PER_CORRECT,
  XP_WIN_PER_LEVEL,
} from "@shared/types";

export function getPlayerStats(level: number) {
  return {
    maxHp: PLAYER_BASE_HP + HP_PER_LEVEL * (level - 1),
    damage: DAMAGE_BASE + DAMAGE_PER_LEVEL * (level - 1),
  };
}

export function getWildStats(level: number) {
  return {
    maxHp: PLAYER_BASE_HP + HP_PER_LEVEL * (level - 1),
    damage: DAMAGE_BASE + DAMAGE_PER_LEVEL * (level - 1),
  };
}

export function pickWildLevel(playerLevel: number): number {
  const offset = Math.floor(Math.random() * 5) - 2; // -2..2 inclusive
  return Math.max(1, playerLevel + offset);
}
```

Note: this also removes the old `WILD_HP_BASE`, `WILD_HP_PER_PLAYER_LEVEL`, `FLAT_DAMAGE`, `XP_PER_WIN` imports (which would break since Task 1 removed them) and the now-unused `getWildMaxHp` helper.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test --workspace=app -- battle-engine`

Expected: the new `getWildStats` and `pickWildLevel` describe blocks PASS. **Other tests in this file will still fail** — they reference the removed `FLAT_DAMAGE` import. That's fixed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/battle-engine.ts app/src/lib/__tests__/battle-engine.test.ts
git commit -m "feat(battle-engine): add getWildStats and pickWildLevel"
```

---

## Task 4: Refactor `createBattle` and damage application to use wild stats

**Files:**

- Modify: `app/src/lib/battle-engine.ts`

- [ ] **Step 1: Update `createBattle` to use `getWildStats` from `wild.level`**

Replace the existing `createBattle` body in `app/src/lib/battle-engine.ts` with:

```typescript
export function createBattle(
  playerPokemon: OwnedPokemon,
  wildPokemon: WildPokemon,
  firstQuestion: Question,
): BattleState {
  const playerStats = getPlayerStats(playerPokemon.level);
  const wildStats = getWildStats(wildPokemon.level);

  return {
    wildPokemon,
    playerPokemon,
    wildHp: wildStats.maxHp,
    wildMaxHp: wildStats.maxHp,
    playerHp: playerStats.maxHp,
    playerMaxHp: playerStats.maxHp,
    currentQuestion: firstQuestion,
    retryQueue: [],
    turnResult: null,
    canCatch: false,
    catchMode: false,
    mode: "menu",
    status: "active",
    xpGained: 0,
  };
}
```

- [ ] **Step 2: Update `submitAnswer` damage source**

Replace the wrong-answer branch in `submitAnswer` to use the wild's damage:

```typescript
  if (correct) {
    wildHp = Math.max(0, wildHp - playerStats.damage);
    xpGained += XP_PER_CORRECT;

    retryQueue = retryQueue.filter(
      (q) =>
        !(
          q.factorA === currentQuestion.factorA &&
          q.factorB === currentQuestion.factorB
        ),
    );
  } else {
    const wildStats = getWildStats(state.wildPokemon.level);
    playerHp = Math.max(0, playerHp - wildStats.damage);
    const alreadyQueued = retryQueue.some(
      (q) =>
        q.factorA === currentQuestion.factorA &&
        q.factorB === currentQuestion.factorB,
    );
    if (!alreadyQueued) {
      retryQueue = [...retryQueue, currentQuestion];
    }
  }
```

Also rename the `stats` local at the top of `submitAnswer` to `playerStats` for clarity:

```typescript
  const playerStats = getPlayerStats(playerPokemon.level);
```

And replace the existing `stats.damage` reference inside the correct-answer branch with `playerStats.damage` (already shown above).

- [ ] **Step 3: Update `attemptCatch` to use wild damage on failed catch**

Replace the failed-catch tail of `attemptCatch` with:

```typescript
  // Catch failed — enemy free attack, return to menu
  const wildStats = getWildStats(state.wildPokemon.level);
  const newPlayerHp = Math.max(0, state.playerHp - wildStats.damage);
  const newStatus = newPlayerHp <= 0 ? ("lost" as const) : state.status;

  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    catchMode: false,
    mode: "menu",
    turnResult: {
      correct: false,
      correctAnswer,
      givenAnswer,
      question: currentQuestion,
    },
  };
```

- [ ] **Step 4: Update `applyFreeDamage` to use wild damage**

Replace the body of `applyFreeDamage` with:

```typescript
export function applyFreeDamage(state: BattleState): BattleState {
  const wildStats = getWildStats(state.wildPokemon.level);
  const newPlayerHp = Math.max(0, state.playerHp - wildStats.damage);
  const newStatus = newPlayerHp <= 0 ? ("lost" as const) : state.status;
  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    mode: "menu",
  };
}
```

- [ ] **Step 5: Run tests (still expect failures in old tests using `FLAT_DAMAGE`)**

Run: `npm test --workspace=app -- battle-engine`

Expected: existing tests still fail because they import `FLAT_DAMAGE` and use a wild without `level`. That's fixed in Task 5.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/battle-engine.ts
git commit -m "refactor(battle-engine): wild damage derives from wild level"
```

---

## Task 5: Update `submitAnswer` win/catch XP to scale with wild level

**Files:**

- Modify: `app/src/lib/battle-engine.ts`

- [ ] **Step 1: Update win-bonus XP in `submitAnswer`**

Replace the end-condition block in `submitAnswer` with:

```typescript
  // Check end conditions
  if (wildHp <= 0) {
    status = "won";
    xpGained += XP_WIN_PER_LEVEL * state.wildPokemon.level;
  } else if (playerHp <= 0) {
    status = "lost";
    xpGained = 0; // No XP on defeat
  }
```

- [ ] **Step 2: Update catch-bonus XP in `attemptCatch`**

Replace the success branch in `attemptCatch` with:

```typescript
  if (correct) {
    return {
      ...state,
      status: "caught",
      xpGained:
        state.xpGained + XP_WIN_PER_LEVEL * state.wildPokemon.level,
      turnResult: {
        correct: true,
        correctAnswer,
        givenAnswer,
        question: currentQuestion,
      },
      catchMode: false,
      mode: "menu",
    };
  }
```

- [ ] **Step 3: Run tests (existing tests still fail — fixed in Task 6)**

Run: `npm test --workspace=app -- battle-engine`

Expected: still fails on missing `FLAT_DAMAGE` import in the test file. Task 6 updates the tests.

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/battle-engine.ts
git commit -m "feat(battle-engine): scale win/catch XP with wild level"
```

---

## Task 6: Update existing battle-engine tests for new constants and wild level

**Files:**

- Modify: `app/src/lib/__tests__/battle-engine.test.ts`

- [ ] **Step 1: Replace mock and damage-related tests**

Replace the entire content of `app/src/lib/__tests__/battle-engine.test.ts` with:

```typescript
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
```

- [ ] **Step 2: Run tests to verify all pass**

Run: `npm test --workspace=app -- battle-engine`

Expected: ALL PASS. The tests now cover wild-level-driven HP/damage and level-scaled XP.

- [ ] **Step 3: Commit**

```bash
git add app/src/lib/__tests__/battle-engine.test.ts
git commit -m "test(battle-engine): cover wild level, level-scaled XP, wild damage"
```

---

## Task 7: Wire wild level into `BattleScreen`

**Files:**

- Modify: `app/src/screens/BattleScreen.tsx`

- [ ] **Step 1: Import `pickWildLevel` and pass `level` when creating the wild**

Edit the import at the top of `app/src/screens/BattleScreen.tsx`:

```typescript
import { useBattle } from "../hooks/useBattle";
import { pickWildLevel } from "../lib/battle-engine";
```

(Add `pickWildLevel` to an existing imports list — group with the existing `../lib/...` imports.)

Replace the `useEffect` that loads the wild Pokémon (around lines 40-53) with:

```typescript
  useEffect(() => {
    const wildId = randomWildPokemonId();
    const wildLevel = pickWildLevel(playerPokemon.level);
    void getPokemon(wildId).then((info) => {
      setWildInfo(info);
      setWildPokemon({
        pokeapiId: info.id,
        name: info.name,
        spriteUrl: info.spriteFront,
        cryUrl: info.cryUrl,
        types: info.types,
        level: wildLevel,
      });
      playCry(info.cryUrl);
    });
  }, [playCry, playerPokemon.level]);
```

- [ ] **Step 2: Show wild's level on the enemy nameplate**

Find the enemy `NamePlate` (around line 224-232) and replace `level={0}` with `level={wildPokemon.level}`:

```tsx
        <div className={styles.enemyPlatePos}>
          <NamePlate
            name={wildPokemon.name}
            level={wildPokemon.level}
            currentHp={battle.wildHp}
            maxHp={battle.wildMaxHp}
            side="enemy"
          />
        </div>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS for `app/tsconfig.json`. (`functions/tsconfig.json` will still complain until Task 12.)

- [ ] **Step 4: Run app tests**

Run: `npm test --workspace=app`

Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/BattleScreen.tsx
git commit -m "feat(battle): pick wild level via ±2 range and show on nameplate"
```

---

## Task 8: Pass wild level when catching in `useBattle`

**Files:**

- Modify: `app/src/hooks/useBattle.ts`

- [ ] **Step 1: Update `handleCatch` to send `level` to the API**

In `app/src/hooks/useBattle.ts`, replace the `handleCatch` body with:

```typescript
  const handleCatch = useCallback(
    async (givenAnswer: number) => {
      const newState = attemptCatch(battle, givenAnswer);
      setBattle(newState);

      if (newState.status === "caught") {
        await api.catchPokemon({
          pokeapi_id: wildPokemon.pokeapiId,
          level: wildPokemon.level,
        });
      }

      return newState;
    },
    [battle, wildPokemon],
  );
```

- [ ] **Step 2: Run app tests**

Run: `npm test --workspace=app`

Expected: PASS. (Will compile-fail at typecheck until Task 9 widens `CatchRequest`.)

- [ ] **Step 3: Commit**

```bash
git add app/src/hooks/useBattle.ts
git commit -m "feat(battle): pass wild level when catching"
```

---

## Task 9: Extend `CatchRequest` type and `api.catchPokemon`

**Files:**

- Modify: `shared/types.ts`
- Modify: `app/src/lib/api-client.ts`

- [ ] **Step 1: Add optional `level` to `CatchRequest`**

Edit `shared/types.ts` and replace the `CatchRequest` interface with:

```typescript
export interface CatchRequest {
  pokeapi_id: number;
  nickname?: string;
  level?: number;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS for `app/tsconfig.json`. (`functions/tsconfig.json` may still complain about removed constants in `pokemon.ts`/`save.ts`.)

The existing `api.catchPokemon` in `app/src/lib/api-client.ts` already accepts `CatchRequest` and forwards the body verbatim, so no changes are needed there.

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat(types): allow optional level on CatchRequest"
```

---

## Task 10: Server-side accept and persist `level` on catch

**Files:**

- Modify: `functions/api/pokemon.ts`

- [ ] **Step 1: Update POST handler to insert `level` when provided**

Replace the `onRequestPost` body in `functions/api/pokemon.ts` with:

```typescript
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const body = (await context.request.json()) as CatchRequest;
  const sql = getDb(context.env);

  const level = body.level ?? 1;

  const result = await sql`
    INSERT INTO pokemon_collection (trainer_id, pokeapi_id, nickname, level)
    VALUES (${trainerId}, ${body.pokeapi_id}, ${body.nickname ?? null}, ${level})
    RETURNING id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
  `;

  return json(result[0]);
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS for `functions/tsconfig.json` (this file specifically). Other files may still fail until later tasks.

- [ ] **Step 3: Commit**

```bash
git add functions/api/pokemon.ts
git commit -m "feat(api): accept optional level when creating a Pokémon"
```

---

## Task 11: Starter joins at Lv5

**Files:**

- Modify: `app/src/App.tsx`

- [ ] **Step 1: Pass `level: 5` in the starter onSelect callback**

In `app/src/App.tsx`, locate the `StarterSelectScreen` block (around line 105) and replace the `onSelect` body:

```tsx
      {screen === "starter-select" && (
        <StarterSelectScreen
          onSelect={async (pokeapiId) => {
            const caught = await api.catchPokemon({
              pokeapi_id: pokeapiId,
              level: 5,
            });
            await api.updatePokemon({
              pokemon_id: caught.id,
              set_active: true,
            });
            const collection = await api.getCollection();
            auth.updateCollection(collection);
            setScreen("hub");
          }}
        />
      )}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS for `app/tsconfig.json`.

- [ ] **Step 3: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat(starter): start new starters at level 5"
```

---

## Task 12: Cascade level-ups in `App.handleBattleEnd`

**Files:**

- Modify: `app/src/App.tsx`

- [ ] **Step 1: Replace the single-level branch with cascade + final-level evolution check**

In `app/src/App.tsx`, replace the import and `handleBattleEnd` body. First, update the imports near the top:

```typescript
import { applyXp } from "@shared/types";
import type { Screen, BattleResult } from "@shared/types";
```

(Remove the `xpToNextLevel` import — `applyXp` replaces its use here. Note: `BattleScreen.tsx` still imports `xpToNextLevel` from `@shared/types` for the XP bar calculation; do not remove that import there.)

Then replace `handleBattleEnd`:

```typescript
  async function handleBattleEnd(result: BattleResult) {
    if (activePokemon && result.outcome !== "lost") {
      const { newLevel, newXp, leveledUp } = applyXp(
        activePokemon.level,
        activePokemon.xp,
        result.xpGained,
      );

      await api.updatePokemon({
        pokemon_id: activePokemon.id,
        xp: newXp,
        level: leveledUp ? newLevel : undefined,
      });

      if (leveledUp) {
        result = { ...result, leveledUp: true, newLevel };
        const evoCheck = await checkEvolution(
          activePokemon.pokeapi_id,
          newLevel,
        );
        if (evoCheck.shouldEvolve && evoCheck.evolvesToId) {
          result = {
            ...result,
            evolved: true,
            evolvedTo: evoCheck.evolvesToId,
          };
        }
      }
    }

    if (result.caughtPokemon) {
      const info = await getPokemon(result.caughtPokemon.pokeapiId);
      setCaughtPokemonInfo(info);
    }

    setBattleResult(result);

    const collection = await api.getCollection();
    auth.updateCollection(collection);

    setScreen("battle-result");
  }
```

Also update the `BattleScreen` `finishBattle` (in `app/src/screens/BattleScreen.tsx`) — the local one currently computes `leveledUp` and `newLevel` itself but `handleBattleEnd` recomputes properly using cascade. Replace that block (around lines 119-140):

```typescript
  const finishBattle = useCallback(
    (outcome: "won" | "lost" | "caught") => {
      void onEnd({
        outcome,
        xpGained: battle.xpGained,
        leveledUp: false,
        newLevel: playerPokemon.level,
        evolved: false,
        evolvedTo: null,
        caughtPokemon: outcome === "caught" ? wildPokemon : null,
      });
    },
    [battle.xpGained, onEnd, playerPokemon.level, wildPokemon],
  );
```

This pushes the level-up math into `App.handleBattleEnd` (one place, cascading) instead of computing a single-level guess in `BattleScreen`. Also remove the `xpToNextLevel` import from `BattleScreen.tsx` if it's now unused — but it's still used for the XP bar `xpToNext={xpToNextLevel(playerPokemon.level)}` (line 251), so keep it.

- [ ] **Step 2: Run typecheck and tests**

Run: `npm run typecheck && npm test --workspace=app`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/App.tsx app/src/screens/BattleScreen.tsx
git commit -m "feat(progression): cascade level-ups and check evolution at final level"
```

---

## Task 13: Server-side cascade migration in `GET /api/save`

**Files:**

- Modify: `functions/api/save.ts`

- [ ] **Step 1: Run cascade per Pokémon and write back updated rows**

Replace the entire body of `functions/api/save.ts` with:

```typescript
import { getDb, type Env } from "./_db";
import { getTrainerId, unauthorized, json } from "./_auth";
import type { GameState, OwnedPokemon } from "../../shared/types";
import { applyXp } from "../../shared/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const trainerId = getTrainerId(context.request);
  if (!trainerId) return unauthorized();

  const sql = getDb(context.env);

  const [collectionRaw, difficulty] = await Promise.all([
    sql`
      SELECT id, trainer_id, pokeapi_id, nickname, level, xp, is_active, caught_at
      FROM pokemon_collection
      WHERE trainer_id = ${trainerId}
      ORDER BY caught_at ASC
    `,
    sql`
      SELECT id, trainer_id, factor_a, factor_b, score, updated_at
      FROM difficulty
      WHERE trainer_id = ${trainerId}
    `,
  ]);

  const collection = collectionRaw as unknown as OwnedPokemon[];

  // Migrate any over-cap XP into level-ups (cascade). Persist if any row changed.
  const migrated: OwnedPokemon[] = [];
  for (const p of collection) {
    const { newLevel, newXp, leveledUp } = applyXp(p.level, p.xp, 0);
    if (leveledUp) {
      await sql`
        UPDATE pokemon_collection
        SET level = ${newLevel}, xp = ${newXp}
        WHERE id = ${p.id} AND trainer_id = ${trainerId}
      `;
      migrated.push({ ...p, level: newLevel, xp: newXp });
    } else {
      migrated.push(p);
    }
  }

  const state: GameState = {
    collection: migrated,
    difficulty: difficulty as unknown as GameState["difficulty"],
  };

  return json(state);
};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS for both `app/tsconfig.json` and `functions/tsconfig.json`.

- [ ] **Step 3: Manual verification (no automated server tests in this repo)**

Read through the cascade logic once more:

- For a Pokémon with `level=5, xp=600` under the new curve (`xpToNextLevel(5)=270`, `xpToNextLevel(6)=380`): cascade promotes to Lv6 (xp 600−270=330), then Lv7 is not reached since 330 < 380. Final: `{level: 6, xp: 330, leveledUp: true}`. Row gets written back.
- For `level=5, xp=100`: `100 < 270`, no change. Skip the UPDATE. ✓
- Idempotency: a second `GET /api/save` finds nothing to migrate.

- [ ] **Step 4: Commit**

```bash
git add functions/api/save.ts
git commit -m "feat(api): migrate over-cap XP via cascade on save load"
```

---

## Task 14: Final verification

**Files:** none

- [ ] **Step 1: Run full typecheck**

Run: `npm run typecheck`

Expected: PASS for both `app` and `functions`.

- [ ] **Step 2: Run full app tests**

Run: `npm test --workspace=app`

Expected: ALL PASS.

- [ ] **Step 3: Run lint and format**

Run: `npm run lint:fix && npm run format && npm run lint && npm run format:check`

Expected: zero errors, zero warnings.

- [ ] **Step 4: Smoke-test in the browser (per CLAUDE.md "test golden path and edge cases")**

Run: `npm run dev`

Verify in the browser:

1. **New trainer flow:** Sign up, choose a starter — confirm the starter joins at Lv5 (visible on hub nameplate).
2. **First battle:** Enter a battle from hub. Verify the wild's level appears on its nameplate and is in `[playerLevel-2, playerLevel+2]`, clamped to ≥1.
3. **Wrong-answer damage:** Submit a wrong answer; verify player HP decreases by `getWildStats(wild.level).damage` (e.g., 14 against a Lv5 wild).
4. **XP bar:** Win a battle. Verify XP reward = 5 × correct answers + 12 × wild.level. Verify XP bar fills correctly.
5. **Catch:** Catch a Pokémon — verify the new collection entry has `level` matching the wild's level at catch time (check via `Collection` screen).
6. **Multi-level cascade:** (Optional manual SQL check) If you have a test trainer with a high `xp` value, sign in — confirm `GET /api/save` cascades the XP into multiple levels in one shot.

If any check fails, fix and recommit. Do not mark the plan complete with failing checks.

- [ ] **Step 5: Commit any auto-fix changes**

```bash
git status
# If anything was auto-fixed by lint/format:
git add -p
git commit -m "chore: lint/format auto-fixes for leveling redesign"
```

(Skip this step if `git status` is clean.)

---

## Self-Review Notes

- **Spec coverage:**
  - "Quadratic curve `20 + 10·L²`" → Task 1 ✓
  - "Hybrid XP: 5 per correct + 12 × wildLevel on win/catch" → Tasks 1, 5 ✓
  - "Wild Pokémon level via ±2 around player, clamp ≥1" → Tasks 3, 7 ✓
  - "Symmetric stats `50 + 5·(L-1)`, `10 + 1·(L-1)`" → Tasks 1, 3 ✓
  - "Starter Lv5; caught Pokémon join at wild's level" → Tasks 8, 11 ✓
  - "Cascade level-ups, evolution at final level" → Task 12 ✓
  - "Server-side cascade migration on GET /api/save" → Task 13 ✓
  - "Idempotent migration; no SQL schema change" → Task 13 ✓
- **Type consistency:** `applyXp` signature `(level, xp, gained) → {newLevel, newXp, leveledUp}` is the same in Task 1, Task 12, and Task 13. `getWildStats(level)` and `pickWildLevel(playerLevel)` are introduced in Task 3 and used in Tasks 4, 7. `CatchRequest.level?: number` declared in Task 9 matches consumers in Tasks 8, 10, 11.
- **No placeholders:** every code step contains the actual code to write; commands include exact arguments and expected outputs.
