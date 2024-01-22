module.exports = {
  overrides: [
    {
      files: ["**/*.js", "**/*.ts", "**/*.tsx"],
      options: {
        bracketSpacing: true,
        trailingComma: "es5",
        tabWidth: 2,
        printWidth: 120,
        singleQuote: false,
        semi: true,
      },
    },
  ],
};
