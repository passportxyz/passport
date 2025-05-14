import "dotenv/config";

// Initialize logger for identity package
import { logger as identityLogger } from "@gitcoin/passport-identity";
identityLogger.setLogger(logger);

// ---- Main App from index
import { app } from "./server.js";
import { logger } from "./utils/logger.js";
// default port to listen on
const port = process.env.EMBED_PORT || 80;

const startServer = (): void => {
  const server = app.listen(port, () => {
    logger.info(`server started at http://localhost:${port}`);
  });

  // This should be > the ELB idle timeout, which is 60 seconds
  server.keepAliveTimeout = 61 * 1000;
};

try {
  // Start server
  startServer();
} catch (error) {
  logger.error(error);
}
