# Battle Flow Redesign

## Summary

Replace the current continuous question-answer battle flow with a GBA-style action menu system and multiple-choice answers.

## Current Flow

Battle starts → question input appears immediately → player types answer → next question → repeat until battle ends. Catch mode is triggered via a floating pokeball button. No way to switch Pokemon or flee.

## New Flow

### Action Menu

Battle starts in menu mode. The bottom panel shows a 2x2 grid of action buttons:

| FIGHT | POKéMON |
|-------|---------|
| CATCH | RUN     |

- **FIGHT**: Enter fight mode — show multiplication question with 6 multiple-choice answers
- **POKéMON**: Open collection screen to switch active Pokemon. Switching costs a turn: enemy deals FLAT_DAMAGE (10) to the newly switched-in Pokemon. Returns to action menu after switch.
- **CATCH**: Enter catch mode. Only enabled when wild HP <= 25% of max. Disabled/greyed out otherwise. Shows one question with 6 multiple-choice answers. Correct = caught. Wrong = return to action menu.
- **RUN**: Escape battle immediately. Counts as a loss (0 XP). No confirmation dialog.

### Fight Mode

Bottom panel shows:
- The multiplication question text (e.g. "6 x 7 = ?")
- 6 answer buttons in a 3x2 grid (3 columns, 2 rows)
- A BACK button to return to the action menu

After answering (correct or wrong), the player stays in fight mode: animations play, then the next question appears. The player remains in fight mode until they press BACK.

### Multiple-Choice Answer Generation

For a question `factorA x factorB` with correct answer `correct`:
- 1 correct answer
- 5 distractors generated from a pool of plausible wrong answers:
  - Products of nearby factors: `(factorA ± 1) * factorB`, `factorA * (factorB ± 1)`
  - Off-by-one from correct: `correct ± 1`, `correct ± 2`
  - Other multiplication table products in a similar range
- Deduplicate (remove any distractors that equal the correct answer or each other)
- If fewer than 5 unique distractors, fill with random values in range `[correct - 20, correct + 20]` (minimum 1)
- Shuffle all 6 options randomly

### Catch Mode

Same question + 6 multiple-choice format. One question only:
- Correct answer: Pokemon is caught, battle ends
- Wrong answer: return to action menu, battle continues

### Pokemon Switching

Reuse the existing `CollectionScreen` component, rendered inline in place of the battle screen. When the player selects a different Pokemon:
1. Switch active Pokemon via API (`api.updatePokemon`)
2. Enemy deals FLAT_DAMAGE (10) to the new Pokemon
3. Return to action menu

If the player presses BACK in the collection without switching, return to action menu with no penalty.

### Run

Immediately end the battle with outcome "lost" and 0 XP.

## State Changes

### BattleState additions

Add `mode` field to battle state:
```typescript
mode: "menu" | "fight" | "catch" | "pokemon"
```

Battle initializes with `mode: "menu"`.

### Battle Engine

- `submitAnswer`: no changes to damage/HP/XP logic
- `attemptCatch`: no changes to catch logic
- New: `generateChoices(factorA, factorB)` function in a new file or in `difficulty.ts` — returns array of 6 numbers (1 correct + 5 distractors), shuffled

### BattleScreen

- Bottom panel renders based on `mode`:
  - `"menu"`: 2x2 action grid
  - `"fight"`: question text + 3x2 answer grid + BACK button
  - `"catch"`: question text + 3x2 answer grid (no BACK — answer decides outcome, wrong returns to menu automatically)
  - `"pokemon"`: render CollectionScreen inline
- Remove the old floating POKéBALL button
- Remove the old QuestionInput component usage from BattleScreen (replaced by multiple choice)

### QuestionInput

Keep the component for potential reuse elsewhere, but BattleScreen no longer uses it. The multiple-choice buttons are rendered directly in BattleScreen (or in a new `BattleChoices` component).

## New Components

### ActionMenu
Renders the 2x2 action button grid. Props: `onFight`, `onPokemon`, `onCatch`, `onRun`, `catchEnabled: boolean`.

### BattleChoices
Renders question text + 3x2 answer button grid + optional BACK button. Props: `question: Question`, `choices: number[]`, `onAnswer: (answer: number) => void`, `onBack?: () => void`.

## Files Changed

- `app/src/lib/difficulty.ts` — add `generateChoices()` function
- `app/src/hooks/useBattle.ts` — add mode management, generate choices on each question
- `app/src/screens/BattleScreen.tsx` + `.module.css` — new bottom panel rendering (action menu, fight mode, catch mode, pokemon mode)
- `app/src/components/ActionMenu.tsx` + `.module.css` — new component
- `app/src/components/BattleChoices.tsx` + `.module.css` — new component
- `shared/types.ts` — add `mode` to BattleState type
