// ---- Main App from index
import { app } from "./index";

// ---- Production plugins
import cors from "cors";

// default port to listen on
const port = 65535;

// set cors to accept calls from anywhere
app.use(cors());

// start the Express server
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server started at http://localhost:${port}`);
});
