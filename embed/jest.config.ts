import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: [".ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@gitcoin/passport-identity$": "<rootDir>/../node_modules/@gitcoin/passport-identity/dist/esm/index.js",
    "^multiformats/(.*)$": "<rootDir>/../node_modules/multiformats/dist/src/$1.js",
    "^multiformats$": "<rootDir>/../node_modules/multiformats/dist/index.min.js",
    "^@ipld/dag-cbor$": "<rootDir>/../node_modules/@ipld/dag-cbor/esm/index.js",
    "^uint8arrays(/|$)": "<rootDir>/../node_modules/uint8arrays/dist/index.min.js",
    "^(\.\.?/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
    // For transforming the dependencies that aren't playing nicely
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/src/jest.setup.ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!(dids|dag-jose-utils|multiformats|@ipld|rpc-utils|@didtools|codeco|key-did-resolver)/)",
  ],
};

export default config;
