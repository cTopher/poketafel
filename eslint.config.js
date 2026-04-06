import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/",
      "**/node_modules/",
      "**/.wrangler/",
      "**/*.js",
      "shared/",
      "app/vite.config.ts", // not included in any tsconfig project
    ],
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
  {
    rules: {
      // Numbers and nullish values (e.g. CSS module class names) are safe in template literals
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowNullish: true },
      ],
      // Syncing derived state in effects is a legitimate pattern in this codebase
      // (auth loading state, question reset, screen navigation)
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // PokeAPI responses are untyped JSON — unsafe-any rules produce false positives here
    files: ["app/src/lib/pokeapi.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  {
    // Neon SQL query results and Cloudflare request JSON are untyped — relax rules here
    files: ["functions/api/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  prettier,
);
