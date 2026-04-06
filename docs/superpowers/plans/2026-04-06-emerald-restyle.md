# Emerald Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire app to match the Pokemon Emerald GBA aesthetic, with split bottom panel layout (question left, actions right) and authentic name plates with XP bar.

**Architecture:** Pure CSS restyling + minor JSX restructuring. Update global theme variables to Emerald palette, restyle all components and screens, restructure the battle bottom panel into left/right split, and add XP bar to player NamePlate.

**Tech Stack:** React 19, TypeScript, CSS Modules

---

### Task 1: Update global theme and frame styles

**Files:**
- Modify: `app/src/gba-theme.css`
- Modify: `app/src/components/GbaFrame.module.css`
- Modify: `app/src/App.module.css`

- [ ] **Step 1: Replace gba-theme.css**

Replace the full contents of `app/src/gba-theme.css`:

```css
:root {
  /* Emerald palette — matched from GBA screenshots */
  --gba-bg: #b8d8b0;
  --gba-dark: #485848;
  --gba-panel: #f8f0d0;
  --gba-border: #484848;
  --gba-text: #383838;
  --gba-text-light: #f8f8f0;
  --gba-text-shadow: #484848;
  --gba-gold: #f8b800;
  --gba-red: #e84040;
  --gba-green: #38b764;
  --gba-blue: #4888c8;
  --gba-yellow: #f8d030;
  --gba-orange: #f77622;
  --gba-purple: #b55088;
  --gba-cyan: #58a8d8;
  --gba-white: #f8f8f0;
  --gba-hp-green: #58a028;
  --gba-hp-yellow: #f8c800;
  --gba-hp-red: #e04830;
  --gba-grass: #68a848;
  --gba-sky: #98d8a8;

  /* Emerald UI surfaces */
  --gba-plate-bg: linear-gradient(180deg, #f0e8c8 0%, #d8d0b0 100%);
  --gba-textbox-bg: #f8f0d0;
  --gba-textbox-border: #484848;
  --gba-screen-bg: #78a870;
  --gba-teal: #6898a0;
  --gba-accent-red: #c83830;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #root {
  width: 100%; height: 100%; overflow: hidden;
  background: #000;
  font-family: "Press Start 2P", monospace;
  color: var(--gba-text-light);
  -webkit-font-smoothing: none;
  image-rendering: pixelated;
}

body { position: fixed; inset: 0; }
#root { display: flex; align-items: center; justify-content: center; }

.gba-border { border: 3px solid var(--gba-border); border-radius: 8px; }
.gba-panel {
  background: var(--gba-panel);
  border: 3px solid var(--gba-border);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
}

.gba-button {
  font-family: "Press Start 2P", monospace; font-size: 0.7em;
  background: var(--gba-panel); color: var(--gba-text);
  border: 3px solid var(--gba-border); border-radius: 6px;
  padding: 10px 20px; cursor: pointer;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
  transition: background 0.1s;
}
.gba-button:hover { background: #e8e0c0; }
.gba-button:active { transform: scale(0.96); }

.gba-input {
  font-family: "Press Start 2P", monospace; font-size: 0.8em;
  background: #fff; color: #383838;
  border: 3px solid var(--gba-border); border-radius: 4px;
  padding: 8px 12px; outline: none; width: 100%;
}
.gba-input:focus { border-color: var(--gba-blue); }

/* Emerald-style text box used across screens */
.emerald-textbox {
  background: var(--gba-textbox-bg);
  border: 3px solid var(--gba-textbox-border);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.6em;
  line-height: 1.8;
  color: #383838;
  box-shadow: inset -2px -2px 0 #c8c0a0, 2px 2px 0 rgba(0,0,0,0.15);
}

@keyframes blink-cursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
```

- [ ] **Step 2: Update GbaFrame.module.css**

Replace `app/src/components/GbaFrame.module.css`:

```css
.container {
  width: 960px;
  height: 540px;
  transform-origin: center center;
  position: relative;
  overflow: hidden;
  background: var(--gba-screen-bg);
  border-radius: 8px;
  border: 4px solid var(--gba-dark);
}
```

- [ ] **Step 3: Update App.module.css**

Replace `app/src/App.module.css`:

```css
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.8em;
  color: var(--gba-text);
  background: var(--gba-screen-bg);
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit -p app/tsconfig.json && cd app && npx vite build`

- [ ] **Step 5: Commit**

```bash
git add app/src/gba-theme.css app/src/components/GbaFrame.module.css app/src/App.module.css
git commit -m "style: update global theme to Emerald GBA palette"
```

---

### Task 2: Restyle HpBar and NamePlate with XP bar

**Files:**
- Modify: `app/src/components/HpBar.module.css`
- Modify: `app/src/components/HpBar.tsx` (minor — HP tag style)
- Modify: `app/src/components/NamePlate.module.css`
- Modify: `app/src/components/NamePlate.tsx` (add xp/xpToNext props, XP bar)

- [ ] **Step 1: Replace HpBar.module.css**

Replace `app/src/components/HpBar.module.css`:

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.barRow {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label {
  font-size: 0.35em;
  font-weight: bold;
  color: #f8f8f0;
  background: #58a028;
  padding: 1px 4px;
  border-radius: 2px;
  letter-spacing: 1px;
  line-height: 1;
}

.track {
  height: 3px;
  background: #484848;
  border-radius: 1px;
  overflow: hidden;
  border: 1px solid #282828;
}

.fill {
  height: 100%;
  border-radius: 0;
  transition: width 0.5s ease-out, background 0.3s;
}

.numbers {
  font-size: 0.4em;
  text-align: right;
  color: #383838;
  font-family: "Press Start 2P", monospace;
}

.separator {
  color: #888;
}
```

- [ ] **Step 2: Replace NamePlate.module.css**

Replace `app/src/components/NamePlate.module.css`:

```css
.plate {
  background: linear-gradient(180deg, #f0e8c8 0%, #d8d0b0 100%);
  border: 3px solid #484848;
  padding: 6px 12px 6px;
  box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.2);
  position: relative;
}

.platePlayer {
  min-width: 220px;
  border-radius: 8px 0 0 8px;
  border-right: none;
}

.plateEnemy {
  min-width: 190px;
  border-radius: 0 8px 8px 0;
  border-left: none;
}

.nameRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 3px;
  gap: 10px;
}

.name {
  font-size: 0.5em;
  font-family: "Press Start 2P", monospace;
  color: #383838;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.namePlayer {
  max-width: 120px;
}

.nameEnemy {
  max-width: 110px;
}

.level {
  font-size: 0.45em;
  font-family: "Press Start 2P", monospace;
  color: #383838;
  white-space: nowrap;
}

.hpArea {
  display: flex;
  align-items: center;
  gap: 0;
}

.xpBarWrapper {
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.xpLabel {
  font-size: 0.25em;
  font-weight: bold;
  color: #f8f8f0;
  background: #4888c8;
  padding: 1px 3px;
  border-radius: 2px;
  letter-spacing: 1px;
  line-height: 1;
}

.xpTrack {
  flex: 1;
  height: 2px;
  background: #484848;
  border-radius: 1px;
  overflow: hidden;
}

.xpFill {
  height: 100%;
  background: #58a8d8;
  transition: width 0.5s ease-out;
}
```

- [ ] **Step 3: Update NamePlate.tsx with XP bar props**

Replace `app/src/components/NamePlate.tsx`:

```tsx
import { HpBar } from "./HpBar";
import styles from "./NamePlate.module.css";

interface NamePlateProps {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  side: "enemy" | "player";
  xp?: number;
  xpToNext?: number;
}

export function NamePlate({ name, level, currentHp, maxHp, side, xp, xpToNext }: NamePlateProps) {
  const isPlayer = side === "player";

  return (
    <div className={`${styles.plate} ${isPlayer ? styles.platePlayer : styles.plateEnemy}`}>
      <div className={styles.nameRow}>
        <span className={`${styles.name} ${isPlayer ? styles.namePlayer : styles.nameEnemy}`}>
          {name}
        </span>
        <span className={styles.level}>Lv{level}</span>
      </div>

      <div className={styles.hpArea}>
        <HpBar
          current={currentHp}
          max={maxHp}
          width={isPlayer ? 130 : 120}
          showNumbers={isPlayer}
        />
      </div>

      {isPlayer && xp !== undefined && xpToNext !== undefined && (
        <div className={styles.xpBarWrapper}>
          <span className={styles.xpLabel}>EXP</span>
          <div className={styles.xpTrack}>
            <div
              className={styles.xpFill}
              style={{ width: `${Math.min(100, (xp / xpToNext) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Pass xp props from BattleScreen**

In `app/src/screens/BattleScreen.tsx`, find the player NamePlate rendering (around line 198-205) and add xp props:

```tsx
<NamePlate
  name={playerPokemonInfo.name}
  level={playerPokemon.level}
  currentHp={battle.playerHp}
  maxHp={battle.playerMaxHp}
  side="player"
  xp={playerPokemon.xp}
  xpToNext={xpToNextLevel(playerPokemon.level)}
/>
```

Note: `xpToNextLevel` is already imported in BattleScreen.tsx.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit -p app/tsconfig.json && cd app && npx vitest run`

```bash
git add app/src/components/HpBar.module.css app/src/components/NamePlate.module.css app/src/components/NamePlate.tsx app/src/screens/BattleScreen.tsx
git commit -m "style: restyle NamePlate and HpBar to match Emerald GBA"
```

---

### Task 3: Restructure battle bottom panel into left/right split

**Files:**
- Modify: `app/src/screens/BattleScreen.tsx`
- Modify: `app/src/screens/BattleScreen.module.css`
- Modify: `app/src/components/ActionMenu.module.css`
- Modify: `app/src/components/ActionMenu.tsx`
- Modify: `app/src/components/BattleChoices.module.css`
- Modify: `app/src/components/BattleChoices.tsx`

- [ ] **Step 1: Replace BattleScreen.module.css**

Replace `app/src/screens/BattleScreen.module.css`:

```css
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.loadingBattle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.7em;
  color: #383838;
  background: linear-gradient(180deg, #98d8a8 0%, #88c8a0 40%, #78b868 40%, #58983c 100%);
}

/* Battle arena background */
.battleBg {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.battleBg::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #98d8a8 0%, #88c8a0 38%, #78b868 38%, #509038 100%);
}

.battleBg::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 38%;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 8px,
    rgba(255, 255, 255, 0.06) 8px,
    rgba(255, 255, 255, 0.06) 10px
  );
}

.enemyPlatform {
  position: absolute;
  width: 180px;
  height: 20px;
  background: radial-gradient(ellipse, #509038 0%, #68a848 50%, transparent 70%);
  border-radius: 50%;
  right: 60px;
  top: calc(38% - 10px);
}

.playerPlatform {
  position: absolute;
  width: 240px;
  height: 28px;
  background: radial-gradient(ellipse, #407830 0%, #509038 50%, transparent 70%);
  border-radius: 50%;
  left: 30px;
  bottom: 18px;
}

/* Sprite & plate positions */
.enemyPlatePos {
  position: absolute;
  top: 16px;
  left: 0;
  z-index: 2;
}

.wildSpritePos {
  position: absolute;
  right: 70px;
  top: calc(38% - 120px);
  z-index: 1;
}

.playerPlatePos {
  position: absolute;
  bottom: 50px;
  right: 0;
  z-index: 2;
}

.playerSpritePos {
  position: absolute;
  left: 50px;
  bottom: 30px;
  z-index: 1;
}

/* Bottom panel — split left/right like Emerald */
.bottomPanel {
  display: flex;
  min-height: 120px;
  border-top: 4px solid #484848;
}

.bottomLeft {
  flex: 1;
  background: var(--gba-teal);
  border-left: 6px solid var(--gba-accent-red);
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.bottomLeftText {
  font-size: 0.6em;
  color: #f8f8f0;
  font-family: "Press Start 2P", monospace;
  line-height: 1.8;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

.wrongAnswer {
  font-size: 0.5em;
  color: #f8d030;
  font-family: "Press Start 2P", monospace;
  margin-top: 4px;
}

.bottomRight {
  width: 55%;
  background: var(--gba-panel);
  border: 3px solid #484848;
  border-top: none;
  border-right: none;
  border-bottom: none;
  display: flex;
}
```

- [ ] **Step 2: Replace ActionMenu.module.css**

Replace `app/src/components/ActionMenu.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 16px;
  padding: 10px 16px;
  flex: 1;
  align-content: center;
}

.actionButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.55em;
  color: var(--gba-text);
  background: transparent;
  border: none;
  padding: 8px 4px;
  cursor: pointer;
  text-align: left;
}

.actionButton::before {
  content: "";
  display: inline-block;
  width: 8px;
  margin-right: 4px;
}

.actionButton:hover::before {
  content: "▶";
  font-size: 0.7em;
}

.actionButton:active {
  transform: scale(0.96);
}

.fight {
  color: var(--gba-text);
}

.pokemon {
  color: var(--gba-text);
}

.catch {
  color: var(--gba-text);
}

.run {
  color: var(--gba-text);
}

.disabled {
  opacity: 0.35;
  cursor: default;
}

.disabled:hover::before {
  content: "";
}
```

- [ ] **Step 3: Replace BattleChoices.module.css**

Replace `app/src/components/BattleChoices.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  flex: 1;
}

.choicesGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  flex: 1;
}

.choiceButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.5em;
  color: var(--gba-text);
  background: var(--gba-panel);
  border: 2px solid #484848;
  border-radius: 4px;
  padding: 6px 2px;
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;
}

.choiceButton:hover {
  background: #e8e0c0;
}

.choiceButton:active {
  transform: scale(0.96);
}

.backButton {
  font-family: "Press Start 2P", monospace;
  font-size: 0.35em;
  color: #686868;
  background: transparent;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  align-self: flex-start;
}

.backButton::before {
  content: "◀ ";
}

.backButton:hover {
  color: var(--gba-text);
}
```

- [ ] **Step 4: Update BattleChoices.tsx — remove questionText**

Replace `app/src/components/BattleChoices.tsx`:

```tsx
import styles from "./BattleChoices.module.css";

interface BattleChoicesProps {
  choices: number[];
  onAnswer: (answer: number) => void;
  onBack?: () => void;
}

export function BattleChoices({ choices, onAnswer, onBack }: BattleChoicesProps) {
  return (
    <div className={styles.container}>
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
          BACK
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite BattleScreen bottom panel JSX**

Replace the bottom panel section of `app/src/screens/BattleScreen.tsx` (the `{/* Bottom panel */}` section, lines ~217-252). The full return JSX of `BattleActive` (from `return (` to the closing `);`) should be:

```tsx
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
            xp={playerPokemon.xp}
            xpToNext={xpToNextLevel(playerPokemon.level)}
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

      {/* Bottom panel — Emerald split layout */}
      <div className={styles.bottomPanel}>
        <div className={styles.bottomLeft}>
          <div>
            {battle.mode === "menu" && battle.status === "active" && (
              <span className={styles.bottomLeftText}>
                What will {playerPokemonInfo.name} do?
              </span>
            )}
            {battle.mode === "fight" && battle.status === "active" && (
              <>
                <span className={styles.bottomLeftText}>
                  {battle.currentQuestion.factorA} x {battle.currentQuestion.factorB} = ?
                </span>
                {battle.turnResult && !battle.turnResult.correct && (
                  <div className={styles.wrongAnswer}>
                    {battle.turnResult.question.factorA} x {battle.turnResult.question.factorB} = {battle.turnResult.correctAnswer}
                  </div>
                )}
              </>
            )}
            {battle.mode === "catch" && battle.status === "active" && (
              <>
                <span className={styles.bottomLeftText}>
                  {battle.currentQuestion.factorA} x {battle.currentQuestion.factorB} = ?
                </span>
                <div className={styles.wrongAnswer}>Catch it!</div>
              </>
            )}
          </div>
        </div>

        <div className={styles.bottomRight}>
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
              choices={choices}
              onAnswer={onFightAnswer}
              onBack={() => setMode("menu")}
            />
          )}

          {battle.mode === "catch" && battle.status === "active" && (
            <BattleChoices
              choices={choices}
              onAnswer={onCatchAnswer}
            />
          )}
        </div>
      </div>
    </div>
  );
```

Also remove the `Question` import from BattleChoices.tsx (it no longer needs it) and remove the `question` prop from BattleChoices calls in BattleScreen.tsx.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit -p app/tsconfig.json && cd app && npx vitest run`

```bash
git add app/src/screens/BattleScreen.tsx app/src/screens/BattleScreen.module.css app/src/components/ActionMenu.module.css app/src/components/ActionMenu.tsx app/src/components/BattleChoices.module.css app/src/components/BattleChoices.tsx
git commit -m "style: restructure battle bottom panel into Emerald left/right split"
```

---

### Task 4: Restyle all other screens to Emerald palette

**Files:**
- Modify: `app/src/screens/LoginScreen.module.css`
- Modify: `app/src/screens/HubScreen.module.css`
- Modify: `app/src/screens/StarterSelectScreen.module.css`
- Modify: `app/src/screens/CollectionScreen.module.css`
- Modify: `app/src/screens/BattleResultScreen.module.css`

- [ ] **Step 1: Replace LoginScreen.module.css**

Replace `app/src/screens/LoginScreen.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  padding: 40px;
  background: var(--gba-screen-bg);
}

.title {
  font-size: 2em;
  color: #f8d030;
  text-shadow: 3px 3px 0 #504000, -1px -1px 0 #b88000;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 0.5em;
  color: #f0e868;
  text-shadow: 1px 1px 0 #504000;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 360px;
}

.formBox {
  padding: 16px 20px;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.label {
  font-size: 0.6em;
  color: #383838;
}

.labelInput {
  margin-top: 6px;
  display: block;
}

.error {
  font-size: 0.5em;
  color: #e84040;
  text-align: center;
}

.submitButton {
  align-self: center;
  font-size: 0.65em;
}
```

- [ ] **Step 2: Replace HubScreen.module.css**

Replace `app/src/screens/HubScreen.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  background: var(--gba-screen-bg);
  padding: 32px;
}

.title {
  font-size: 1.4em;
  color: #f8d030;
  text-shadow: 3px 3px 0 #504000;
}

.trainerName {
  font-size: 0.5em;
  color: #383838;
}

.pokemonPreview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pokemonLabel {
  font-size: 0.5em;
  text-transform: uppercase;
  color: #383838;
}

.buttonGroup {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 240px;
}

.battleButton {
  width: 100%;
  font-size: 0.65em;
  padding: 14px 20px;
  background: var(--gba-panel);
  border: 3px solid var(--gba-border);
  color: #c03028;
}

.collectionButton {
  width: 100%;
  font-size: 0.65em;
}
```

- [ ] **Step 3: Replace StarterSelectScreen.module.css**

Replace `app/src/screens/StarterSelectScreen.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 24px;
  background: var(--gba-screen-bg);
}

.loadingStarters {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.7em;
  color: #383838;
  background: var(--gba-screen-bg);
}

.promptBox {
  padding: 10px 20px;
}

.promptText {
  text-align: center;
}

.starterGrid {
  display: flex;
  gap: 28px;
}

.starterCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: var(--gba-panel);
  border: 3px solid var(--gba-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.15);
}

.starterCardSelected {
  border-color: #f8d030;
  box-shadow: 0 0 0 2px #f8d030, 2px 2px 0 rgba(0,0,0,0.15);
}

.starterSprite {
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
}

.starterName {
  font-size: 0.55em;
  font-family: "Press Start 2P", monospace;
  color: #383838;
  text-transform: uppercase;
}

.starterType {
  font-size: 0.4em;
  font-family: "Press Start 2P", monospace;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Replace CollectionScreen.module.css**

Replace `app/src/screens/CollectionScreen.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--gba-screen-bg);
  padding: 24px;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.headerTitle {
  font-size: 0.8em;
  color: #383838;
  text-shadow: 1px 1px 0 rgba(255,255,255,0.3);
}

.backButton {
  font-size: 0.5em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.pokemonCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--gba-panel);
  border: 2px solid var(--gba-border);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 1px 1px 0 rgba(0,0,0,0.1);
}

.pokemonCardSelected {
  background: #e8e0c0;
}

.pokemonCardActive {
  border-color: #f8d030;
  box-shadow: 0 0 0 2px #f8d030;
}

.pokemonName {
  font-size: 0.35em;
  text-transform: uppercase;
  color: #383838;
}

.pokemonLevel {
  font-size: 0.3em;
  color: #585858;
}

.activeLabel {
  font-size: 0.25em;
  color: #c08800;
}

.setActiveArea {
  display: flex;
  justify-content: center;
}

.setActiveButton {
  font-size: 0.55em;
}
```

- [ ] **Step 5: Replace BattleResultScreen.module.css**

Replace `app/src/screens/BattleResultScreen.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  background: var(--gba-screen-bg);
  padding: 40px;
}

.outcomeTitle {
  font-size: 1.5em;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
}

.resultBox {
  max-width: 400px;
}

.resultContent {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.levelUp {
  color: #4888c8;
}

.evolving {
  color: #a848a8;
}

.caught {
  color: #38783c;
}

.outcomeWon {
  color: #38783c;
}

.outcomeCaught {
  color: #c08800;
}

.outcomeLost {
  color: #c03028;
}

.continueButton {
  font-size: 0.7em;
}
```

- [ ] **Step 6: Verify build and tests**

Run: `npx tsc --noEmit -p app/tsconfig.json && cd app && npx vitest run && npx vite build`

- [ ] **Step 7: Commit**

```bash
git add app/src/screens/LoginScreen.module.css app/src/screens/HubScreen.module.css app/src/screens/StarterSelectScreen.module.css app/src/screens/CollectionScreen.module.css app/src/screens/BattleResultScreen.module.css
git commit -m "style: restyle all screens to Emerald GBA palette"
```
