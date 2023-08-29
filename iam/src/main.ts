// ---- Main App from index
import { app } from "./index";
import Moralis from "moralis";

// default port to listen on
const port = process.env.IAM_PORT || 80;

const startServer = async (): Promise<void> => {
  await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`server started at http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});
