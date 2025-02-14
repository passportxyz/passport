import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {}],
  },
  setupFilesAfterEnv: ["<rootDir>/src/jest.setup.ts"],
};

export default config;
