import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: [".ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@gitcoin/passport-identity$": "<rootDir>/../node_modules/@gitcoin/passport-identity/dist/esm/index.js",
    "^multiformats/(.*)$": "<rootDir>/../node_modules/multiformats/dist/src/$1.js",
    "^multiformats$": "<rootDir>/../node_modules/multiformats/dist/index.min.js",
    "@ipld/dag-cbor": "<rootDir>/../node_modules/@ipld/dag-cbor/esm/index.js",
    "^uint8arrays$": "<rootDir>/../node_modules/uint8arrays/dist/index.min.js",
    "^mapmoize$": "<rootDir>/../node_modules/mapmoize/dist/index.js",
    "^cartonne$": "<rootDir>/../node_modules/cartonne/dist/index.js",
    "^varintes(/|$)": "<rootDir>/../node_modules/cartonne/dist/index.js",
    "^dag-jose$": "<rootDir>/../node_modules/dag-jose/lib/index.js",
    "^multihashes-sync/(.*)$": "<rootDir>/../node_modules/multihashes-sync/dist/$1.js",
    "^(\\.\\.?/.*)\\.js$": "$1",
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
  transformIgnorePatterns: [
    "/node_modules/(?!(@composedb|@ceramicnetwork|dids|multiformats|uint8arrays|mapmoize|codeco|cartonne|varintes|@ipld|multihashes-sync|dag-jose|dag-jose-utils|rpc-utils|@didtools|key-did-provider-ed25519|key-did-resolver|@spruceid)/)",
  ],
};

export default config;
