import { app } from "./index";

const port = 65535; // default port to listen on

// @TODO fix this
// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
