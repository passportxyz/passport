module.exports = {
  env: {
    es6: true,
    browser: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  ignorePatterns: [".eslintrc.js", "jest.config.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2017,
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint", "prettier", "jest", "react"],
  rules: {
    quotes: ["error", "double"],
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
    "@typescript-eslint/explicit-function-return-type": "warn", // Consider using explicit annotations for object literals and function return types even when they can be inferred.
    "no-empty": "warn",
    "@typescript-eslint/no-misused-promises": 1,
    "@typescript-eslint/no-floating-promises": 1,
    "@typescript-eslint/no-unsafe-assignment": "warn",
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
    react: {
      version: "detect",
    },
  },
};
