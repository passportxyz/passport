import { MODULE_CONFIGS } from "../eslint.config.js";

export default [
  {
    // Ignore non-TS load test assets so @typescript-eslint parser doesn't require a TS project for them
    ignores: ["**/bright-id-script.js", "load_tests/**"],
  },
  ...MODULE_CONFIGS,
];
