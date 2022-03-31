import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import inject from "@rollup/plugin-inject";

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      crypto: require.resolve("crypto-browserify"),
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        inject({
          include: ["node_modules/@ledgerhq/**"],
          modules: { Buffer: ["buffer", "Buffer"] },
        }),
      ],
    },
  },
});
