# Linting & Formatting Setup

## Overview

Add ESLint (strict, type-aware) and Prettier (default formatting) to the poketafel monorepo. Manual scripts only — no pre-commit hooks or dev server integration.

## ESLint

Single `eslint.config.js` at the project root using ESLint v9 flat config.

### Presets & Plugins

- `typescript-eslint` strict type-checked preset
- `eslint-plugin-react` recommended + JSX runtime config
- `eslint-plugin-react-hooks` recommended
- `eslint-config-prettier` applied last to disable conflicting rules

### Scope

- Lints `app/src/**/*.{ts,tsx}` and `functions/**/*.ts`
- Ignores `dist/`, `node_modules/`, build output
- `parserOptions.project` points at workspace tsconfigs for type-aware rules

### Dependencies

- `eslint`
- `typescript-eslint`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-config-prettier`

## Prettier

### Configuration

- `.prettierrc` at root with `{}` (all defaults: double quotes, semicolons, 2-space indent, 80 print width, trailing commas in ES5)
- `.prettierignore` for `dist/`, `node_modules/`, build output

### Dependencies

- `prettier`

## Scripts

Added to root `package.json`:

- `lint` — `eslint .`
- `lint:fix` — `eslint . --fix`
- `format` — `prettier --write .`
- `format:check` — `prettier --check .`

## CLAUDE.md Update

Add a section instructing the agent to:

- Run `npm run lint` and `npm run format:check` before considering work complete
- Run `npm run lint:fix` and `npm run format` to auto-fix issues after making changes

## Existing Codebase

After setup, run `lint:fix` and `format` across the codebase and fix any remaining errors. This is a one-time cleanup included in the implementation.
