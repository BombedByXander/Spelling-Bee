import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...((js && js.configs && js.configs.recommended && js.configs.recommended.rules) || {}),
      ...((tsPlugin && tsPlugin.configs && tsPlugin.configs.recommended && tsPlugin.configs.recommended.rules) || {}),
      ...((reactHooks && reactHooks.configs && reactHooks.configs.recommended && reactHooks.configs.recommended.rules) || {}),
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];
