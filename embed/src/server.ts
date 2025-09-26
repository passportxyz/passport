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
import { autoVerificationHandler, verificationHandler, getChallengeHandler, getScoreHandler } from "./handlers.js";
import { metadataHandler } from "./metadata.js";
import { serverUtils } from "./utils/identityHelper.js";
import { logger } from "./utils/logger.js";

// ---- Config - check for all required env variables
// We want to prevent the app from starting with default values or if it is misconfigured
const configErrors = [];

if (!process.env.IAM_JWK) {
  configErrors.push("IAM_JWK is required");
}

if (!process.env.SCORER_ENDPOINT) {
  configErrors.push("SCORER_ENDPOINT is required");
}

if (!process.env.SCORER_API_KEY) {
  configErrors.push("SCORER_API_KEY is required");
}

if (!process.env.IAM_JWK_EIP712) {
  configErrors.push("IAM_JWK_EIP712 is required");
}

// Check for DB configuration
if (!process.env.REDIS_URL) {
  configErrors.push("Redis configuration is required: REDIS_URL");
}

if (configErrors.length > 0) {
  configErrors.forEach((error) => logger.error(error));
  throw new Error("Missing required configuration: " + configErrors.join(",\n"));
}

if (!process.env.SIGN_PROTOCOL_API_KEY) {
  configErrors.push("SIGN_PROTOCOL_API_KEY is required");
}

// create the app and run on port
export const app = express();

// set cors to accept calls from anywhere and expose X-RateLimit-Limit header
// Register CORS before body parsing so errors (e.g. payload too large) still include headers
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["X-RateLimit-Limit"],
  })
);

// parse JSON post bodies (increase limit to accommodate larger payloads)
app.use(express.json({ limit: "4mb" }));

// Use the rate limiting middleware
app.use(
  rateLimit({
    windowMs: 60 * 1000, // We calculate the limit for a 1 minute interval ...
    limit: apiKeyRateLimit,
    // Redis store configuration
    keyGenerator: keyGenerator,
    store: getRateLimiterStore(),
    skip: (req, _res): boolean => {
      // TODO the /embed/verify exemption is temporary, should be safe to remove ~June 2025
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
app.get("/embed/score/:scorerId/:address", getScoreHandler);

// This custom error handler needs to be last
app.use(serverUtils.errorHandlerMiddleware);
