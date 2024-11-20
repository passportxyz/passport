import "dotenv/config";

// ---- Main App from index
import { app } from "./index.js";

// default port to listen on
const port = process.env.EMBED_PORT || 80;

const startServer = (): void => {
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`server started at http://localhost:${port}`);
  });

  // This should be > the ELB idle timeout, which is 60 seconds
  server.keepAliveTimeout = 61 * 1000;
};

try {
  startServer();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error);
}
