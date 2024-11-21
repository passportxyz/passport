// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import express from "express";

// ---- Production plugins
import cors from "cors";

// ---- Modules
// import { autoVerificationHandler } from "./utils/autoVerification.js";

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

if (configErrors.length > 0) {
  configErrors.forEach((error) => console.error(error)); // eslint-disable-line no-console
  throw new Error("Missing required configuration");
}

// create the app and run on port
export const app = express();

// parse JSON post bodies
app.use(express.json());

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

// app.post("/api/v0.0.0/auto-verification", autoVerificationHandler);
