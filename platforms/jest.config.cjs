/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  // [...]
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
