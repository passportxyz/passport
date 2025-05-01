import { handler } from "./src/index";
import * as dotenv from "dotenv";
dotenv.config();

handler()
  .then(console.log)
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
