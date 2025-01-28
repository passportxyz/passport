module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["<rootDir>/jest.setup.cjs"],
};
