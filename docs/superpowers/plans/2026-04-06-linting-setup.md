# Linting & Formatting Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ESLint (strict, type-aware) and Prettier (defaults) to the poketafel monorepo with manual scripts.

**Architecture:** Single ESLint flat config at root covering both `app/` and `functions/` workspaces, with type-aware rules via `typescript-eslint` strict preset. Prettier with default settings. No hooks or dev server integration.

**Tech Stack:** ESLint 9, typescript-eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-config-prettier, Prettier

---

## File Structure

- **Create:** `eslint.config.js` — ESLint v9 flat config at project root
- **Create:** `.prettierrc` — Prettier config (empty object for defaults)
- **Create:** `.prettierignore` — Ignore patterns for Prettier
- **Modify:** `package.json` — Add devDependencies and scripts
- **Modify:** `CLAUDE.md` — Add linting/formatting instructions for agents

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install ESLint and plugins**

```bash
npm install -D eslint typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier
```

- [ ] **Step 2: Verify installation**

```bash
npx eslint --version
npx prettier --version
```

Expected: ESLint v9.x and Prettier v3.x version numbers printed.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install eslint and prettier dependencies"
```

---

### Task 2: Configure ESLint

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Create ESLint flat config**

Create `eslint.config.js` at the project root:

```js
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["**/dist/", "**/node_modules/", "**/*.js"],
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["app/src/**/*.{ts,tsx}"],
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["app/src/**/*.{ts,tsx}"],
    ...react.configs.flat["jsx-runtime"],
  },
  {
    files: ["app/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  prettier,
);
```

Key details:
- `projectService: true` lets typescript-eslint automatically find the right tsconfig for each file.
- `ignores` with `**/*.js` prevents ESLint from trying to type-check the config file itself.
- React plugin only applies to `app/src/` files (functions/ has no React).
- `react.configs.flat["jsx-runtime"]` disables the "React must be in scope" rule since the project uses the automatic JSX transform.
- `prettier` config applied last disables all formatting rules that conflict with Prettier.

- [ ] **Step 2: Verify ESLint runs without crashing**

```bash
npx eslint . 2>&1 | head -20
```

Expected: Either lint errors/warnings listed (which we'll fix in Task 5) or clean output. Should NOT crash with config errors.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add eslint flat config with strict type-checked rules"
```

---

### Task 3: Configure Prettier

**Files:**
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 1: Create Prettier config**

Create `.prettierrc` at the project root:

```json
{}
```

- [ ] **Step 2: Create Prettier ignore file**

Create `.prettierignore` at the project root:

```
dist/
node_modules/
package-lock.json
```

- [ ] **Step 3: Verify Prettier runs**

```bash
npx prettier --check "app/src/**/*.{ts,tsx}" 2>&1 | head -10
```

Expected: Lists files that need formatting (or says all matched). Should NOT crash.

- [ ] **Step 4: Commit**

```bash
git add .prettierrc .prettierignore
git commit -m "chore: add prettier config with defaults"
```

---

### Task 4: Add Scripts and Update CLAUDE.md

**Files:**
- Modify: `package.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add scripts to root package.json**

Add these four scripts to the `"scripts"` object in `package.json`:

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

The full scripts section should look like:

```json
"scripts": {
  "dev": "concurrently \"npm run dev:app\" \"npm run dev:functions\"",
  "dev:app": "npm run dev --workspace=app",
  "dev:functions": "wrangler pages dev app/dist --port 8788",
  "build": "npm run build --workspace=app",
  "typecheck": "tsc --noEmit --project app/tsconfig.json && tsc --noEmit --project functions/tsconfig.json",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

- [ ] **Step 2: Update CLAUDE.md**

Add a new section to `CLAUDE.md` after the Styling section:

```markdown
## Linting & Formatting

- Run `npm run lint:fix` and `npm run format` to auto-fix issues after making changes.
- Run `npm run lint` and `npm run format:check` before considering work complete. All checks must pass with zero errors or warnings.
```

- [ ] **Step 3: Verify scripts work**

```bash
npm run lint 2>&1 | tail -5
npm run format:check 2>&1 | tail -5
```

Expected: Both commands run without script errors. Lint may report errors (fixed in Task 5). Format may report unformatted files (fixed in Task 5).

- [ ] **Step 4: Commit**

```bash
git add package.json CLAUDE.md
git commit -m "chore: add lint/format scripts and update CLAUDE.md"
```

---

### Task 5: Fix Existing Codebase

**Files:**
- Modify: All `app/src/**/*.{ts,tsx}` and `functions/**/*.ts` files as needed

This is the one-time cleanup pass. Auto-fix what can be auto-fixed, then manually resolve remaining errors.

- [ ] **Step 1: Run Prettier to format all files**

```bash
npm run format
```

Expected: Prettier reformats files and prints the list of changed files.

- [ ] **Step 2: Run ESLint auto-fix**

```bash
npm run lint:fix
```

Expected: Fixes what it can automatically. May still report errors that need manual fixes.

- [ ] **Step 3: Check remaining lint errors**

```bash
npm run lint 2>&1
```

Review the output. For each remaining error, fix it manually. Common issues with `strict-type-checked`:
- **`@typescript-eslint/no-floating-promises`** — Add `void` before fire-and-forget promises, or `await` them.
- **`@typescript-eslint/no-unsafe-assignment`** / **`no-unsafe-member-access`** — Add type annotations to values coming from untyped sources.
- **`@typescript-eslint/no-unnecessary-condition`** — Remove conditions that TypeScript already guarantees (e.g., checking a non-nullable value for null).
- **`@typescript-eslint/restrict-template-expressions`** — Ensure template literal expressions are strings/numbers.
- **`@typescript-eslint/no-confusing-void-expression`** — Don't return void expressions (e.g., `return setState(x)` → `setState(x); return;`).

If a specific rule produces many false positives in context that are clearly safe (e.g., PokeAPI responses), it's acceptable to add a targeted rule override in `eslint.config.js` for those files rather than littering the codebase with `// eslint-disable` comments.

- [ ] **Step 4: Verify everything passes**

```bash
npm run lint && npm run format:check && npm run typecheck
```

Expected: All three commands pass with zero errors and zero warnings.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: fix all lint and formatting errors across codebase"
```
