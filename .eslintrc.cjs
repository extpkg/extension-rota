/**
 * @type {import('eslint').ESLint.ConfigData}
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}", "*.config.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      env: {
        node: true,
        es6: true,
      },
      files: ["scripts/*"],
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: { "prettier/prettier": "error" },
  ignorePatterns: ["dist/*"],
};
