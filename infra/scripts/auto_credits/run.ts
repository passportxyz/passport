// Local runner for testing
import { runAutoCredits } from "./src/index";

runAutoCredits(true)
  .then((result) => {
    console.log("Finished with status:", result.statusCode);
    process.exit(result.statusCode === 200 ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
