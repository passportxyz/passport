/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
};
