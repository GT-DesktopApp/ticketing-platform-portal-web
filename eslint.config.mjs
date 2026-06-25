import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/**
 * Flat ESLint config.
 *
 * Layers:
 *   1. Next.js core-web-vitals + TypeScript rules (framework correctness).
 *   2. `simple-import-sort` — deterministic, auto-fixable import/export ordering.
 *   3. `eslint-config-prettier` LAST — disables stylistic rules that would
 *      conflict with Prettier (Prettier owns formatting, ESLint owns correctness).
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side-effect imports.
            ["^\\u0000"],
            // Node builtins and external packages.
            ["^node:", "^@?\\w"],
            // Internal absolute aliases (@/...).
            ["^@/"],
            // Parent and sibling relative imports.
            ["^\\.\\.(?!/?$)", "^\\.\\./?$", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports.
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
