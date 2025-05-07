import { type JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^multiformats/(.*)$": "<rootDir>/../node_modules/multiformats/dist/src/$1.js",
    "^multiformats$": "<rootDir>/../node_modules/multiformats/dist/index.min.js",
    "^@ipld/dag-cbor$": "<rootDir>/../node_modules/@ipld/dag-cbor/esm/index.js",
    "^uint8arrays(/|$)": "<rootDir>/../node_modules/uint8arrays/dist/index.min.js",
    "^(..?/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(j|t)s$": [
      // Use babel-jest to transpile both local typescript files and
      // the dependencies that only available in esm format (dids, etc)
      "babel-jest",
      {
        presets: ["@babel/preset-typescript", ["@babel/preset-env", { targets: { node: "current" } }]],
        plugins: [
          "@babel/plugin-syntax-import-assertions",
          "babel-plugin-transform-import-meta",
          ["babel-plugin-replace-import-extension", { extMapping: { ".js": "" } }],
          "@babel/plugin-transform-modules-commonjs",
        ],
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/src/jest.setup.ts"],
  transformIgnorePatterns: [
    "/node_modules/(?!(dids|dag-jose-utils|multiformats|@ipld|rpc-utils|@didtools|codeco|key-did-resolver)/)",
  ],
};

export default config;
