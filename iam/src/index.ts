// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { router as procedureRouter } from "@gitcoin/passport-platforms/procedure-router";
import { challengeHandler, checkHandler, easScoreV2Handler, verifyHandler } from "./handlers/index.js";

import { serverUtils } from "./utils/identityHelper.js";
import { logger } from "./utils/logger.js";

// ---- Config - check for all required env variables
// We want to prevent the app from starting with default values or if it is misconfigured
const configErrors = [
  "IAM_JWK",
  "ATTESTATION_SIGNER_PRIVATE_KEY",
  "TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY",
  "ALLO_SCORER_ID",
  "SCORER_ENDPOINT",
  "SCORER_API_KEY",
  "EAS_GITCOIN_STAMP_SCHEMA",
  "MORALIS_API_KEY",
  "IAM_JWK_EIP712",
  "EAS_FEE_USD",
  "SCROLL_BADGE_PROVIDER_INFO",
  "SCROLL_BADGE_ATTESTATION_SCHEMA_UID",
  "HUMAN_NETWORK_CLIENT_PRIVATE_KEY",
  "HUMAN_NETWORK_RELAY_URL",
  "HUMAN_NETWORK_START_VERSION",
  "SIGN_PROTOCOL_API_KEY",
]
  .map((env) => (process.env[env] ? null : `${env} is required`))
  .filter(Boolean);

if (configErrors.length > 0) {
  configErrors.forEach((error) => logger.error(error));
  throw new Error("Missing required configuration");
}

// create the app and run on port
export const app = express();

// parse JSON post bodies (increase limit to accommodate larger payloads)
app.use(express.json({ limit: "4mb" }));

// set cors to accept calls from anywhere
app.use(cors());

// health check endpoint
app.get("/health", (_req, res) => {
  const data = {
    message: "Ok",
    date: new Date(),
  };

  res.status(200).send(data);
});

// issue a challenge to a user
app.post("/api/v0.0.0/challenge", challengeHandler);

// check which stamps a user is eligible for
app.post("/api/v0.0.0/check", checkHandler);

// verify a user's claim to stamps and issue the stamps if the claim is valid
app.post("/api/v0.0.0/verify", verifyHandler);

// issue a signed EAS payload
app.post("/api/v0.0.0/eas/scoreV2", easScoreV2Handler);

// procedure endpoints
app.use("/procedure", procedureRouter);

app.use("/static", express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "static")));

// This custom error handler needs to be last
app.use(serverUtils.errorHandlerMiddleware);
