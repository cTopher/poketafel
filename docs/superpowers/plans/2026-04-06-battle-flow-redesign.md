# Battle Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the continuous question-input battle flow with a GBA-style action menu (Fight/Pokemon/Catch/Run) and 6-option multiple-choice answers.

**Architecture:** Add a `mode` field to `BattleState` that drives which bottom panel renders: action menu, fight (multiple choice), catch (multiple choice), or pokemon (inline collection). New `generateChoices()` function produces 6 plausible answers. Two new components: `ActionMenu` and `BattleChoices`.

**Tech Stack:** React 19, TypeScript, Vite, CSS Modules, Vitest

---

### Task 1: Add `generateChoices()` to difficulty.ts

**Files:**
- Modify: `app/src/lib/difficulty.ts`
- Test: `app/src/lib/__tests__/difficulty.test.ts`

- [ ] **Step 1: Write failing tests for generateChoices**

Add to `app/src/lib/__tests__/difficulty.test.ts`:

```typescript
import { generateChoices } from "../difficulty";

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
      // All distractors should be within a reasonable range
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(correct + 30);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx vitest run src/lib/__tests__/difficulty.test.ts`
Expected: FAIL — `generateChoices` is not exported / does not exist.

- [ ] **Step 3: Implement generateChoices**

Add to the bottom of `app/src/lib/difficulty.ts`:

```typescript
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx vitest run src/lib/__tests__/difficulty.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/difficulty.ts app/src/lib/__tests__/difficulty.test.ts
git commit -m "feat: add generateChoices() for multiple-choice answers"
```

---

### Task 2: Add `mode` to BattleState and update battle engine

**Files:**
- Modify: `shared/types.ts`
- Modify: `app/src/lib/battle-engine.ts`
- Test: `app/src/lib/__tests__/battle-engine.test.ts`

- [ ] **Step 1: Add mode to BattleState type**

In `shared/types.ts`, add `mode` to the `BattleState` interface:

```typescript
export type BattleMode = "menu" | "fight" | "catch" | "pokemon";

export interface BattleState {
  // ... existing fields ...
  mode: BattleMode;
}
```

- [ ] **Step 2: Update createBattle to initialize mode**

In `app/src/lib/battle-engine.ts`, update `createBattle` to include `mode: "menu"` in the returned object:

```typescript
return {
  // ... existing fields ...
  mode: "menu",
};
```

- [ ] **Step 3: Update attemptCatch to apply free damage on failure**

In `app/src/lib/battle-engine.ts`, update the catch-failed branch of `attemptCatch` to deal `FLAT_DAMAGE` to the player and return to menu mode:

```typescript
export function attemptCatch(state: BattleState, givenAnswer: number): BattleState {
  const { currentQuestion } = state;
  const correctAnswer = currentQuestion.factorA * currentQuestion.factorB;
  const correct = givenAnswer === correctAnswer;

  if (correct) {
    return {
      ...state,
      status: "caught",
      xpGained: state.xpGained + XP_PER_WIN,
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

  // Catch failed — enemy free attack, return to menu
  const newPlayerHp = Math.max(0, state.playerHp - FLAT_DAMAGE);
  const newStatus = newPlayerHp <= 0 ? "lost" as const : state.status;

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
}
```

- [ ] **Step 4: Update submitAnswer to preserve mode**

In `app/src/lib/battle-engine.ts`, the `submitAnswer` function spreads `...state` so `mode` is already preserved. Just change `catchMode: false` to also not reset `mode`. Verify the spread at the end of `submitAnswer` includes `mode` from the existing state (it does via `...state`). No code change needed — just verify.

- [ ] **Step 5: Add a takeDamage helper for Pokemon switching**

Add to `app/src/lib/battle-engine.ts`:

```typescript
export function applyFreeDamage(state: BattleState): BattleState {
  const newPlayerHp = Math.max(0, state.playerHp - FLAT_DAMAGE);
  const newStatus = newPlayerHp <= 0 ? "lost" as const : state.status;
  return {
    ...state,
    playerHp: newPlayerHp,
    status: newStatus,
    xpGained: newStatus === "lost" ? 0 : state.xpGained,
    mode: "menu",
  };
}
```

- [ ] **Step 6: Write tests for updated engine**

Add to `app/src/lib/__tests__/battle-engine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createBattle, attemptCatch, applyFreeDamage } from "../battle-engine";
import { FLAT_DAMAGE } from "@shared/types";
import type { OwnedPokemon, WildPokemon, Question } from "@shared/types";

const mockPlayer: OwnedPokemon = {
  id: 1, trainer_id: 1, pokeapi_id: 25, nickname: null,
  level: 5, xp: 0, is_active: true, caught_at: "",
};

const mockWild: WildPokemon = {
  pokeapiId: 1, name: "bulbasaur", spriteUrl: "", cryUrl: "", types: ["grass"],
};

const mockQuestion: Question = { factorA: 3, factorB: 4 };

describe("createBattle", () => {
  it("initializes with mode 'menu'", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    expect(state.mode).toBe("menu");
  });
});

describe("attemptCatch", () => {
  it("deals FLAT_DAMAGE on failed catch", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const before = state.playerHp;
    const after = attemptCatch(state, 999); // wrong answer
    expect(after.playerHp).toBe(before - FLAT_DAMAGE);
    expect(after.mode).toBe("menu");
  });

  it("sets status to caught on correct answer", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const after = attemptCatch(state, 12); // 3 * 4 = 12
    expect(after.status).toBe("caught");
  });
});

describe("applyFreeDamage", () => {
  it("reduces player HP by FLAT_DAMAGE", () => {
    const state = createBattle(mockPlayer, mockWild, mockQuestion);
    const before = state.playerHp;
    const after = applyFreeDamage(state);
    expect(after.playerHp).toBe(before - FLAT_DAMAGE);
    expect(after.mode).toBe("menu");
  });

  it("sets status to lost when HP reaches 0", () => {
    const state = { ...createBattle(mockPlayer, mockWild, mockQuestion), playerHp: 5 };
    const after = applyFreeDamage(state);
    expect(after.playerHp).toBe(0);
    expect(after.status).toBe("lost");
    expect(after.xpGained).toBe(0);
  });
});
```

- [ ] **Step 7: Run all tests**

Run: `cd app && npx vitest run`
Expected: All PASS.

- [ ] **Step 8: Commit**

```bash
git add shared/types.ts app/src/lib/battle-engine.ts app/src/lib/__tests__/battle-engine.test.ts
git commit -m "feat: add mode to BattleState, free damage on failed catch and switch"
```

---

### Task 3: Create ActionMenu component

**Files:**
- Create: `app/src/components/ActionMenu.tsx`
- Create: `app/src/components/ActionMenu.module.css`

- [ ] **Step 1: Create ActionMenu.module.css**

Create `app/src/components/ActionMenu.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 16px;
  flex: 1;
}

.actionButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.55em;
  color: #383838;
  background: #f0f0e8;
  border: 3px solid #585858;
  border-radius: 6px;
  padding: 12px 8px;
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;
}

.actionButton:hover {
  background: #d8d8d0;
}

.actionButton:active {
  transform: scale(0.96);
}

.fight {
  color: #c03028;
}

.pokemon {
  color: #4888c8;
}

.catch {
  color: #f8b800;
}

.run {
  color: #585858;
}

.disabled {
  opacity: 0.35;
  cursor: default;
}

.disabled:hover {
  background: #f0f0e8;
}
```

- [ ] **Step 2: Create ActionMenu.tsx**

Create `app/src/components/ActionMenu.tsx`:

```tsx
import styles from "./ActionMenu.module.css";

interface ActionMenuProps {
  onFight: () => void;
  onPokemon: () => void;
  onCatch: () => void;
  onRun: () => void;
  catchEnabled: boolean;
}

export function ActionMenu({ onFight, onPokemon, onCatch, onRun, catchEnabled }: ActionMenuProps) {
  return (
    <div className={styles.grid}>
      <button className={`${styles.actionButton} ${styles.fight}`} onClick={onFight}>
        FIGHT
      </button>
      <button className={`${styles.actionButton} ${styles.pokemon}`} onClick={onPokemon}>
        POKéMON
      </button>
      <button
        className={`${styles.actionButton} ${styles.catch} ${!catchEnabled ? styles.disabled : ""}`}
        onClick={catchEnabled ? onCatch : undefined}
        disabled={!catchEnabled}
      >
        CATCH
      </button>
      <button className={`${styles.actionButton} ${styles.run}`} onClick={onRun}>
        RUN
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ActionMenu.tsx app/src/components/ActionMenu.module.css
git commit -m "feat: add ActionMenu component with 2x2 GBA-style grid"
```

---

### Task 4: Create BattleChoices component

**Files:**
- Create: `app/src/components/BattleChoices.tsx`
- Create: `app/src/components/BattleChoices.module.css`

- [ ] **Step 1: Create BattleChoices.module.css**

Create `app/src/components/BattleChoices.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px;
  flex: 1;
}

.questionText {
  font-size: 0.7em;
  color: #383838;
  font-family: "Press Start 2P", monospace;
  text-align: center;
}

.choicesGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  flex: 1;
}

.choiceButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.55em;
  color: #383838;
  background: #f0f0e8;
  border: 3px solid #585858;
  border-radius: 4px;
  padding: 8px 4px;
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;
}

.choiceButton:hover {
  background: #d8d8d0;
}

.choiceButton:active {
  transform: scale(0.96);
}

.backButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.4em;
  color: #585858;
  background: transparent;
  border: 2px solid #585858;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  align-self: flex-start;
}

.backButton:hover {
  background: rgba(88, 88, 88, 0.1);
}
```

- [ ] **Step 2: Create BattleChoices.tsx**

Create `app/src/components/BattleChoices.tsx`:

```tsx
import type { Question } from "@shared/types";
import styles from "./BattleChoices.module.css";

interface BattleChoicesProps {
  question: Question;
  choices: number[];
  onAnswer: (answer: number) => void;
  onBack?: () => void;
}

export function BattleChoices({ question, choices, onAnswer, onBack }: BattleChoicesProps) {
  return (
    <div className={styles.container}>
      <div className={styles.questionText}>
        {question.factorA} x {question.factorB} = ?
      </div>
      <div className={styles.choicesGrid}>
        {choices.map((choice, i) => (
          <button
            key={i}
            className={styles.choiceButton}
            onClick={() => onAnswer(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      {onBack && (
        <button className={styles.backButton} onClick={onBack}>
          ◀ BACK
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/src/components/BattleChoices.tsx app/src/components/BattleChoices.module.css
git commit -m "feat: add BattleChoices component with 3x2 multiple-choice grid"
```

---

### Task 5: Update useBattle hook with mode management and choices

**Files:**
- Modify: `app/src/hooks/useBattle.ts`

- [ ] **Step 1: Rewrite useBattle hook**

Replace the full contents of `app/src/hooks/useBattle.ts`:

```typescript
import { useState, useCallback } from "react";
import type { BattleState, BattleMode, OwnedPokemon, WildPokemon, DifficultyRow } from "@shared/types";
import { FLAT_DAMAGE } from "@shared/types";
import { createBattle, submitAnswer, attemptCatch, applyFreeDamage } from "../lib/battle-engine";
import {
  buildDifficultyMap, pickWeightedQuestion, calculateScoreDelta,
  applyScoreDelta, generateChoices, type DifficultyMap,
} from "../lib/difficulty";
import { api } from "../lib/api-client";

interface UseBattleOptions {
  playerPokemon: OwnedPokemon;
  wildPokemon: WildPokemon;
  difficultyRows: DifficultyRow[];
  onBattleEnd: () => void;
}

export function useBattle({ playerPokemon, wildPokemon, difficultyRows, onBattleEnd }: UseBattleOptions) {
  const [difficultyMap] = useState<DifficultyMap>(() => buildDifficultyMap(difficultyRows));

  const [battle, setBattle] = useState<BattleState>(() => {
    const firstQuestion = pickWeightedQuestion(difficultyMap, []);
    return createBattle(playerPokemon, wildPokemon, firstQuestion);
  });

  const [choices, setChoices] = useState<number[]>(() =>
    generateChoices(battle.currentQuestion.factorA, battle.currentQuestion.factorB)
  );

  const [answerStart, setAnswerStart] = useState(Date.now());

  const setMode = useCallback((mode: BattleMode) => {
    setBattle((s) => ({ ...s, mode }));
  }, []);

  const enterFight = useCallback(() => {
    const ch = generateChoices(battle.currentQuestion.factorA, battle.currentQuestion.factorB);
    setChoices(ch);
    setBattle((s) => ({ ...s, mode: "fight" }));
    setAnswerStart(Date.now());
  }, [battle.currentQuestion]);

  const enterCatch = useCallback(() => {
    const ch = generateChoices(battle.currentQuestion.factorA, battle.currentQuestion.factorB);
    setChoices(ch);
    setBattle((s) => ({ ...s, mode: "catch", catchMode: true }));
    setAnswerStart(Date.now());
  }, [battle.currentQuestion]);

  const handleAnswer = useCallback(
    async (givenAnswer: number) => {
      const timeMs = Date.now() - answerStart;
      const { currentQuestion } = battle;
      const correct = givenAnswer === currentQuestion.factorA * currentQuestion.factorB;

      api.submitAnswer({
        factor_a: currentQuestion.factorA,
        factor_b: currentQuestion.factorB,
        given_answer: givenAnswer,
        time_ms: timeMs,
      }).catch(() => {});

      const delta = calculateScoreDelta(correct, timeMs);
      applyScoreDelta(difficultyMap, currentQuestion.factorA, currentQuestion.factorB, delta);

      const nextRetryQueue = correct
        ? battle.retryQueue.filter(
            (q) => !(q.factorA === currentQuestion.factorA && q.factorB === currentQuestion.factorB)
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
    [battle, answerStart, difficultyMap]
  );

  const handleCatch = useCallback(
    async (givenAnswer: number) => {
      const newState = attemptCatch(battle, givenAnswer);
      setBattle(newState);

      if (newState.status === "caught") {
        await api.catchPokemon({ pokeapi_id: wildPokemon.pokeapiId });
      }

      return newState;
    },
    [battle, wildPokemon]
  );

  const handleSwitch = useCallback(() => {
    const newState = applyFreeDamage(battle);
    setBattle(newState);
    return newState;
  }, [battle]);

  const handleRun = useCallback(() => {
    setBattle((s) => ({ ...s, status: "lost", xpGained: 0, mode: "menu" }));
  }, []);

  return {
    battle,
    choices,
    enterFight,
    enterCatch,
    setMode,
    handleAnswer,
    handleCatch,
    handleSwitch,
    handleRun,
  };
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit -p app/tsconfig.json`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/hooks/useBattle.ts
git commit -m "feat: update useBattle with mode management and choice generation"
```

---

### Task 6: Rewrite BattleScreen to use action menu and multiple choice

**Files:**
- Modify: `app/src/screens/BattleScreen.tsx`
- Modify: `app/src/screens/BattleScreen.module.css`

- [ ] **Step 1: Update BattleScreen.module.css**

Remove `.pokeballButton` from `app/src/screens/BattleScreen.module.css`. Add no new styles — the bottom panel styles (`.bottomPanel`, `.wrongAnswer`) stay, and the new components bring their own CSS modules.

- [ ] **Step 2: Rewrite BattleActive in BattleScreen.tsx**

Replace the full contents of `app/src/screens/BattleScreen.tsx`:

```tsx
import { useState, useEffect } from "react";
import type { OwnedPokemon, DifficultyRow, BattleResult } from "@shared/types";
import { xpToNextLevel, FLAT_DAMAGE } from "@shared/types";
import { useBattle } from "../hooks/useBattle";
import { useSound } from "../hooks/useSound";
import { getPokemon, randomWildPokemonId, type PokemonBasicInfo } from "../lib/pokeapi";
import { NamePlate } from "../components/NamePlate";
import { PokemonSprite } from "../components/PokemonSprite";
import { ActionMenu } from "../components/ActionMenu";
import { BattleChoices } from "../components/BattleChoices";
import { CollectionScreen } from "./CollectionScreen";
import type { WildPokemon } from "@shared/types";
import styles from "./BattleScreen.module.css";

interface BattleScreenProps {
  playerPokemon: OwnedPokemon;
  playerPokemonInfo: PokemonBasicInfo;
  difficultyRows: DifficultyRow[];
  collection: OwnedPokemon[];
  onEnd: (result: BattleResult) => void;
  onCollectionUpdate: (collection: OwnedPokemon[]) => void;
}

export function BattleScreen({ playerPokemon, playerPokemonInfo, difficultyRows, collection, onEnd, onCollectionUpdate }: BattleScreenProps) {
  const [wildInfo, setWildInfo] = useState<PokemonBasicInfo | null>(null);
  const [wildPokemon, setWildPokemon] = useState<WildPokemon | null>(null);
  const { playCry } = useSound();

  useEffect(() => {
    const wildId = randomWildPokemonId();
    getPokemon(wildId).then((info) => {
      setWildInfo(info);
      setWildPokemon({
        pokeapiId: info.id,
        name: info.name,
        spriteUrl: info.spriteFront,
        cryUrl: info.cryUrl,
        types: info.types,
      });
      playCry(info.cryUrl);
    });
  }, [playCry]);

  if (!wildPokemon || !wildInfo) {
    return (
      <div className={styles.loadingBattle}>
        A wild POKéMON appears...
      </div>
    );
  }

  return (
    <BattleActive
      playerPokemon={playerPokemon}
      playerPokemonInfo={playerPokemonInfo}
      wildPokemon={wildPokemon}
      wildInfo={wildInfo}
      difficultyRows={difficultyRows}
      collection={collection}
      onEnd={onEnd}
      onCollectionUpdate={onCollectionUpdate}
    />
  );
}

function BattleActive({
  playerPokemon,
  playerPokemonInfo,
  wildPokemon,
  wildInfo,
  difficultyRows,
  collection,
  onEnd,
  onCollectionUpdate,
}: BattleScreenProps & { wildPokemon: WildPokemon; wildInfo: PokemonBasicInfo }) {
  const {
    battle, choices, enterFight, enterCatch, setMode,
    handleAnswer, handleCatch, handleSwitch, handleRun,
  } = useBattle({
    playerPokemon,
    wildPokemon,
    difficultyRows,
    onBattleEnd: () => {},
  });
  const { playSfx, playCry } = useSound();
  const [spriteAnims, setSpriteAnims] = useState({ wild: "idle", player: "idle" });

  // Check for battle end from run or lost-during-catch/switch
  useEffect(() => {
    if (battle.status === "lost") {
      finishBattle("lost");
    }
  }, [battle.status]);

  async function onFightAnswer(givenAnswer: number) {
    const result = await handleAnswer(givenAnswer);

    if (result.turnResult?.correct) {
      playSfx("hit");
      setSpriteAnims({ wild: "damage", player: "attack" });
    } else {
      playSfx("wrong");
      playSfx("damage");
      setSpriteAnims({ wild: "idle", player: "damage" });
    }

    setTimeout(() => setSpriteAnims({ wild: "idle", player: "idle" }), 400);

    if (result.status !== "active") {
      const outcome = result.status as "won" | "lost" | "caught";
      setTimeout(() => finishBattle(outcome), 800);
    }
  }

  async function onCatchAnswer(givenAnswer: number) {
    const result = await handleCatch(givenAnswer);
    if (result.status === "caught") {
      playSfx("catch");
      playCry(wildPokemon.cryUrl);
      finishBattle("caught");
    } else {
      playSfx("wrong");
      // Free damage applied by attemptCatch, animate it
      setSpriteAnims({ wild: "attack", player: "damage" });
      setTimeout(() => setSpriteAnims({ wild: "idle", player: "idle" }), 400);
      // mode already set to "menu" by attemptCatch
    }
  }

  function onRunAction() {
    handleRun();
  }

  function onSwitchPokemon(updated: OwnedPokemon[]) {
    onCollectionUpdate(updated);
    const newState = handleSwitch();
    // Animate enemy free attack
    setSpriteAnims({ wild: "attack", player: "damage" });
    setTimeout(() => setSpriteAnims({ wild: "idle", player: "idle" }), 400);
  }

  function finishBattle(outcome: "won" | "lost" | "caught") {
    const xpGained = battle.xpGained;
    const currentXp = playerPokemon.xp + xpGained;
    const needed = xpToNextLevel(playerPokemon.level);
    const leveledUp = currentXp >= needed;
    const newLevel = leveledUp ? playerPokemon.level + 1 : playerPokemon.level;

    onEnd({
      outcome,
      xpGained,
      leveledUp,
      newLevel,
      evolved: false,
      evolvedTo: null,
      caughtPokemon: outcome === "caught" ? wildPokemon : null,
    });
  }

  // Pokemon mode renders collection fullscreen
  if (battle.mode === "pokemon") {
    return (
      <CollectionScreen
        collection={collection}
        onBack={() => setMode("menu")}
        onCollectionUpdate={onSwitchPokemon}
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Battle arena */}
      <div className={styles.battleBg}>
        <div className={styles.enemyPlatform} />
        <div className={styles.playerPlatform} />

        <div className={styles.enemyPlatePos}>
          <NamePlate
            name={wildPokemon.name}
            level={0}
            currentHp={battle.wildHp}
            maxHp={battle.wildMaxHp}
            side="enemy"
          />
        </div>

        <div className={styles.wildSpritePos}>
          <PokemonSprite
            src={wildInfo.spriteFront}
            alt={wildPokemon.name}
            size={110}
            animation={spriteAnims.wild as any}
          />
        </div>

        <div className={styles.playerPlatePos}>
          <NamePlate
            name={playerPokemonInfo.name}
            level={playerPokemon.level}
            currentHp={battle.playerHp}
            maxHp={battle.playerMaxHp}
            side="player"
          />
        </div>

        <div className={styles.playerSpritePos}>
          <PokemonSprite
            src={playerPokemonInfo.spriteBack}
            alt={playerPokemon.nickname ?? playerPokemonInfo.name}
            size={120}
            animation={spriteAnims.player as any}
          />
        </div>
      </div>

      {/* Bottom panel */}
      <div className={styles.bottomPanel}>
        {/* Wrong answer feedback */}
        {battle.turnResult && !battle.turnResult.correct && (
          <div className={styles.wrongAnswer}>
            {battle.turnResult.question.factorA} x {battle.turnResult.question.factorB} = {battle.turnResult.correctAnswer}
          </div>
        )}

        {battle.mode === "menu" && battle.status === "active" && (
          <ActionMenu
            onFight={enterFight}
            onPokemon={() => setMode("pokemon")}
            onCatch={enterCatch}
            onRun={onRunAction}
            catchEnabled={battle.canCatch}
          />
        )}

        {battle.mode === "fight" && battle.status === "active" && (
          <BattleChoices
            question={battle.currentQuestion}
            choices={choices}
            onAnswer={onFightAnswer}
            onBack={() => setMode("menu")}
          />
        )}

        {battle.mode === "catch" && battle.status === "active" && (
          <BattleChoices
            question={battle.currentQuestion}
            choices={choices}
            onAnswer={onCatchAnswer}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove pokeballButton from CSS**

In `app/src/screens/BattleScreen.module.css`, delete the `.pokeballButton` block (lines 98-107).

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit -p app/tsconfig.json`
Expected: Errors in `App.tsx` because `BattleScreen` props changed (new `collection` and `onCollectionUpdate` props). This is fixed in Task 7.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/BattleScreen.tsx app/src/screens/BattleScreen.module.css
git commit -m "feat: rewrite BattleScreen with action menu and multiple-choice answers"
```

---

### Task 7: Update App.tsx to pass collection to BattleScreen

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Add collection and onCollectionUpdate props to BattleScreen usage**

In `app/src/App.tsx`, find the `BattleScreen` rendering block and add the two new props:

```tsx
{screen === "battle" && activePokemon && playerPokemonInfo && (
  <BattleScreen
    playerPokemon={activePokemon}
    playerPokemonInfo={playerPokemonInfo}
    difficultyRows={auth.difficulty}
    collection={auth.collection}
    onEnd={handleBattleEnd}
    onCollectionUpdate={auth.updateCollection}
  />
)}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit -p app/tsconfig.json`
Expected: No errors.

- [ ] **Step 3: Run all tests**

Run: `cd app && npx vitest run`
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat: pass collection props to BattleScreen for Pokemon switching"
```

---

### Task 8: Remove QuestionInput from BattleScreen imports and clean up

**Files:**
- Modify: `app/src/screens/BattleScreen.tsx`

- [ ] **Step 1: Remove unused QuestionInput import**

In `app/src/screens/BattleScreen.tsx`, delete the import line:

```typescript
import { QuestionInput } from "../components/QuestionInput";
```

It is no longer used in this file. The `QuestionInput` component itself stays in the codebase for potential reuse.

- [ ] **Step 2: Remove unused CSS classes**

In `app/src/screens/BattleScreen.module.css`, remove `.questionArea`, `.catchArea`, and `.catchPrompt` — they are no longer referenced.

- [ ] **Step 3: Run TypeScript check and build**

Run: `npx tsc --noEmit -p app/tsconfig.json && cd app && npx vite build`
Expected: No errors, build succeeds.

- [ ] **Step 4: Run all tests**

Run: `cd app && npx vitest run`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/screens/BattleScreen.tsx app/src/screens/BattleScreen.module.css
git commit -m "chore: remove unused QuestionInput and CSS from BattleScreen"
```
