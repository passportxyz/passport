import "dotenv/config";

// Initialize logger for identity package
import { logger as identityLogger } from "@gitcoin/passport-identity";
identityLogger.setLogger(logger);

import { logger } from "./utils/logger.js";

// ---- Main App from index
import { app } from "./index.js";
import Moralis from "moralis";

// default port to listen on
const port = process.env.IAM_PORT || 80;

const startServer = async (): Promise<void> => {
  await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });

  const server = app.listen(port, () => {
    logger.info(`server started at http://localhost:${port}`);
  });

  // This should be > the ELB idle timeout, which is 60 seconds
  server.keepAliveTimeout = 61 * 1000;
};

startServer().catch((error) => {
  logger.error(error);
});
