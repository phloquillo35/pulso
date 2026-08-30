import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";

// Next 16 removed `next lint`; this is the equivalent ESLint 9 flat config
// (mirrors next/core-web-vitals + next/typescript without the broken
// FlatCompat bridge). mcp/ is plain Node ESM run by `npm test`, so it's ignored.
export default [
  { ignores: [".next/**", "node_modules/**", "mcp/**", "supabase/**"] },
  // Plain Node ESM modules (e.g. *-logic.mjs, http.mjs, next.config.mjs) run
  // under Node and may use process, fetch, AbortSignal and URL. Treat them as
  // Node so those globals are known and sourceType is module.
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  next.configs["core-web-vitals"],
  next.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  {
    settings: { react: { version: "detect" } },
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
