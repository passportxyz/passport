import { defineConfig } from "vite";
import EnvironmentPlugin from 'vite-plugin-environment'

import path from "path";
import react from "@vitejs/plugin-react";

import wasm from "vite-plugin-wasm";

import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [
    react(),
    wasm({
      filter: /.*\.wasm$/,
    }),
    EnvironmentPlugin(['DPOPP_GOOGLE_CLIENT_ID', 'DPOPP_IAM_URL']),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
  build: {
    target: "modules",
    minify: "terser",
  },
});
