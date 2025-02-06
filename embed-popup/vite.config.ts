import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { nodePolyfills } from "vite-plugin-node-polyfills";

// import builtins from "rollup-plugin-node-builtins";

// // See example here: https://github.com/wighawag/vite-test/blob/master/vite.config.js

// // We need this otherwise building fails, as the twitter-api-v2 lib pulls in `fs`
// const builtinsPlugin = builtins({ fs: true });
// builtinsPlugin.name = "builtins"; // required, see https://github.com/vitejs/vite/issues/728

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ["fs", "https"],
      // // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
      // exclude: [
      //   "http", // Excludes the polyfill for `http` and `node:http`.
      // ],
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
      // // Override the default polyfills for specific modules.
      // overrides: {
      //   // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
      //   fs: "memfs",
      // },
      // // Whether to polyfill `node:` protocol imports.
      // protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      // fs: "./src/polyfills/fs.js",
      // https: "./src/polyfills/https.js",
    },
  },
  define: {
    // "process.env": {}, // Ensure process.env exists
    // global: {}, // Ensure global exists
    // "Buffer": Buffer, // Ensure Buffer exists
  },
  optimizeDeps: {
    include: ["buffer"], // Ensure `buffer` is included in optimization
  },
});
