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
} from "../utils/identityHelper.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms
import { errorRes } from "../utils/helpers.js";
import { formatExceptionMessages } from "@gitcoin/passport-platforms";

export const challengeHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  const payload: RequestPayload = requestBody.payload;

  if (!payload.address) {
    return void errorRes(
      res,
      "Missing address from challenge request body",
      400,
    );
  }

  if (!payload.type) {
    return void errorRes(res, "Missing type from challenge request body", 400);
  }

  // ensure address is check-summed
  payload.address = getAddress(payload.address);

  // generate a challenge for the given payload
  const record = {
    version: "0.0.0",
    ...getChallengeRecord(payload),
  };

  const { issuer } = getIssuerInfo();

  try {
    // generate a VC for the given payload
    const credential = await issueChallengeCredential(
      DIDKit,
      issuer.key,
      record,
    );

    // return the verifiable credential
    return void res.json(credential as CredentialResponseBody);
  } catch (error: unknown) {
    const { userMessage, systemMessage } = formatExceptionMessages(
      error,
      "Unable to produce a verifiable credential",
    );

    // TODO Is this what we want to do? Do we want to add any additional context?
    console.log(systemMessage); // eslint-disable-line no-console

    return void errorRes(res, userMessage, 400);
  }
};
