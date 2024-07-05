const nextJest = require("next/jest");
global.TextDecoder = require("util").TextDecoder;

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {},
  moduleNameMapper: {
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    // Handle module aliases
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/pages/(.*)$": "<rootDir>/pages/$1",
    "@web3modal/ethers/react": "<rootDir>/__mocks__/web3modalMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  setupFiles: ["jest-localstorage-mock"],
  resetMocks: false,
};

export default createJestConfig(customJestConfig);
