import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/providers/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/components/traces/trace-form-dialog.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal, JSXAttribute[name.name='className'] > TemplateLiteral",
          message:
            "Use @curolia/ui components and layout props instead of inline className strings in apps/web.",
        },
      ],
    },
  },
]);
