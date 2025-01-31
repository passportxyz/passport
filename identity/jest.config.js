module.exports = {
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  preset: "ts-jest",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
