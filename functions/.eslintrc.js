module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "@typescript-eslint/no-var-requires": 0,
    "indent": ["error", 2, { "SwitchCase": 1 }],
    // NEW: eslint-config-google defaults max-len to 80, which is tight for
    // code with Firestore document paths and TypeScript type signatures.
    // Bumped to 120, a common modern default (e.g. Prettier's).
    "max-len": ["error", { "code": 120 }],
  },
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        // NEW: whatever formats .js files in this editor setup adds spaces
        // inside braces on save (confirmed — this very file kept getting
        // reformatted that way). Rather than fight the formatter, allow it
        // here, scoped to .js files only, so .ts files (which are NOT being
        // reformatted that way) keep the project's actual "never" default.
        "object-curly-spacing": ["error", "always"],
      },
    },
  ],
};
