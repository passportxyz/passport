// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// This is pulled out to allow easier mocking in tests
export const verifySimpleProvider = (payload: RequestPayload): VerifiedPayload => {
  const valid = payload?.proofs?.valid === "true";
  const errors = valid ? [] : ["Proof is not valid"];
  return {
    valid,
    errors,
    record: {
      username: payload?.proofs?.username || "",
    },
  };
};
