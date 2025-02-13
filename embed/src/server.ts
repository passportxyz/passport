// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import express from "express";

// ---- Production plugins
import cors from "cors";
import { rateLimit } from "express-rate-limit";

// --- Relative imports
import { apiKeyRateLimit, getRateLimiterStore } from "./rateLimiter.js";
import { keyGenerator } from "./rateLimiterKeyGenerator.js";
import { autoVerificationHandler, verificationHandler, getChallengeHandler } from "./handlers.js";
import { metadataHandler } from "./metadata.js";

// ---- Config - check for all required env variables
// We want to prevent the app from starting with default values or if it is misconfigured
const configErrors = [];

if (!process.env.IAM_JWK) {
  configErrors.push("IAM_JWK is required");
}

if (!process.env.ATTESTATION_SIGNER_PRIVATE_KEY) {
  configErrors.push("ATTESTATION_SIGNER_PRIVATE_KEY is required");
}

if (!process.env.TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY) {
  configErrors.push("TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY is required");
}

if (!process.env.ALLO_SCORER_ID) {
  configErrors.push("ALLO_SCORER_ID is required");
}

if (!process.env.SCORER_ENDPOINT) {
  configErrors.push("SCORER_ENDPOINT is required");
}

if (!process.env.SCORER_API_KEY) {
  configErrors.push("SCORER_API_KEY is required");
}

if (!process.env.EAS_GITCOIN_STAMP_SCHEMA) {
  configErrors.push("EAS_GITCOIN_STAMP_SCHEMA is required");
}

if (!process.env.MORALIS_API_KEY) {
  configErrors.push("MORALIS_API_KEY is required");
}

if (!process.env.IAM_JWK_EIP712) {
  configErrors.push("IAM_JWK_EIP712 is required");
}

if (!process.env.EAS_FEE_USD) {
  configErrors.push("EAS_FEE_USD is required");
}

// Check for DB configuration
if (!process.env.REDIS_URL) {
  configErrors.push("Redis configuration is required: REDIS_URL");
}

if (configErrors.length > 0) {
  configErrors.forEach((error) => console.error(error)); // eslint-disable-line no-console
  throw new Error("Missing required configuration: " + configErrors.join(",\n"));
}

// create the app and run on port
export const app = express();

// parse JSON post bodies
app.use(express.json());

// set cors to accept calls from anywhere
app.use(cors());

// Use the rate limiting middleware
app.use(
  rateLimit({
    windowMs: 60 * 1000, // We calculate the limit for a 1 minute interval ...
    limit: apiKeyRateLimit,
    // Redis store configuration
    keyGenerator: keyGenerator,
    store: getRateLimiterStore(),
    skip: (req, res): boolean => {
      // TODO: geri review this, /verify should be removed ...
      console.log("geri --- path", req.path);
      return req.path === "/health" || req.path === "/embed/challenge" || req.path === "/embed/verify";
    },
  })
);

// health check endpoint
app.get("/health", (_req, res) => {
  const data = {
    message: "Ok",
  };

  res.status(200).send(data);
});

app.post("/embed/auto-verify", autoVerificationHandler);
app.post("/embed/verify", verificationHandler);
// Returns the metadata for the stamps
// Receives a query parameter `scorerId` and returns the stamp metadata for that scorer
app.get("/embed/stamps/metadata", metadataHandler);

// expose challenge entry point
app.post("/embed/challenge", getChallengeHandler);
