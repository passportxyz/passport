import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  moduleNameMapper: {
    "^multiformats/(.*)$": "<rootDir>/../node_modules/multiformats/dist/src/$1.js",
    "^multiformats$": "<rootDir>/../node_modules/multiformats/dist/index.min.js",
    "^@ipld/dag-cbor$": "<rootDir>/../node_modules/@ipld/dag-cbor/esm/index.js",
    "^uint8arrays(/|$)": "<rootDir>/../node_modules/uint8arrays/dist/index.min.js",
    "^(\\.\\.?/.*)\\.js$": "$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
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
    "/node_modules/(?!(dids|dag-jose-utils|multiformats|@ipld|rpc-utils|@didtools|codeco|uint8arrays|key-did-resolver)/)",
  ],
};

export default config;
