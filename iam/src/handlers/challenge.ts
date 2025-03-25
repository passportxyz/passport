import { Request } from "express";

import { getAddress } from "ethers";

import { Response } from "express";
import {
  RequestPayload,
  ChallengeRequestBody,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

import {
  getChallengeRecord,
  getIssuerInfo,
  issueChallengeCredential,
  serverUtils,
} from "../utils/identityHelper.js";

const { ApiError } = serverUtils;

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

export const challengeHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  const payload: RequestPayload = requestBody.payload;

  ["address", "type"].forEach((key: keyof RequestPayload) => {
    if (!payload[key]) {
      throw new ApiError(
        `Missing ${key} from challenge request body`,
        "BAD_REQUEST",
      );
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
  return void res.json(credential as CredentialResponseBody);
};
