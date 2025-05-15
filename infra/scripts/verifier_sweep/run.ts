import * as dotenv from "dotenv";
dotenv.config();

import { handler } from "./src/index";

const useEnv = process.argv.includes("--env");

handler(useEnv)
  .then(console.log)
  .catch((error: any) => {
    console.error("Error:", error);
    process.exit(1);
  });
