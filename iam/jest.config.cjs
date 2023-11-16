module.exports = {
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["dotenv/config", "<rootDir>/jest.setup.cjs"],
  testEnvironment: "node",
};
