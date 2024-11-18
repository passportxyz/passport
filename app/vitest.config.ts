import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts", "vitest-localstorage-mock"],
    environmentOptions: {
      customElements: {
        forcePolyfill: true,
      },
    },
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
});
