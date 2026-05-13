import { CredentialType } from "@holonym-foundation/human-id-sdk";
import type { CleanHandsOptions } from "@holonym-foundation/human-id-interface-core";

export const CLEAN_HANDS_CREDENTIAL_TYPE: CredentialType = "clean-hands";

// Show both the Onfido card and the ZK Passport card in the Human ID iframe.
// The ZK Passport branch issues to the same Sign Protocol schema, so the
// existing attestationFetcher covers both branches.
export const CLEAN_HANDS_OPTIONS: CleanHandsOptions = {
  regularKYC: true,
  zkPassport: true,
};
