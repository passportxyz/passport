export default {
  transform: {},
  testMatch: ["**/integration-tests/**/*.js"],
  extensionsToTreatAsEsm: [".ts"],
  testTimeout: 10000,
  setupFiles: ["<rootDir>/jest.setup.cjs"],
};
