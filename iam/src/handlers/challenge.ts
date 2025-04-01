import { getAddress } from "ethers";
import { ChallengeRequestBody, CredentialResponseBody } from "@gitcoin/passport-types";

import { getChallengeRecord, getIssuerInfo, issueChallengeCredential, serverUtils } from "../utils/identityHelper.js";

const { ApiError, createHandler } = serverUtils;

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

export const challengeHandler = createHandler<ChallengeRequestBody, CredentialResponseBody>(async (req, res) => {
  const payload = req.body.payload;

  (["address", "type"] as const).forEach((key) => {
    if (!payload[key]) {
      throw new ApiError(`Missing ${key} from challenge request body`, "400_BAD_REQUEST");
    }
  });

  // ensure address is check-summed
  payload.address = getAddress(payload.address);

  // generate a challenge for the given payload
  const record = {
    version: "0.0.0",
    ...getChallengeRecord(payload),
  };

  const { issuer } = getIssuerInfo();

  // generate a VC for the given payload
  const credential = await issueChallengeCredential(DIDKit, issuer.key, record);

  // return the verifiable credential
  return void res.json(credential);
});
