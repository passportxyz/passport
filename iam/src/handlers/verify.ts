import { Request } from "express";
import { Response } from "express";
import { VerifyRequestBody } from "@gitcoin/passport-types";

import {
  hasValidIssuer,
  VerifyDidChallengeBaseError,
  verifyCredential,
  groupProviderTypesByPlatform,
  verifyProvidersAndIssueCredentials,
  verifyChallengeAndGetAddress,
} from "../utils/identityHelper.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms
import { errorRes, ApiError } from "../utils/helpers.js";
import { formatExceptionMessages } from "@gitcoin/passport-platforms";
export const verifyHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const requestBody: VerifyRequestBody = req.body as VerifyRequestBody;
    // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
    const challenge = requestBody.challenge;
    // get the payload from the JSON req body
    const payload = requestBody.payload;

    // Check the challenge and the payload is valid before issuing a credential from a registered provider
    const verified = await verifyCredential(DIDKit, challenge);

    if (!hasValidIssuer(challenge.issuer)) {
      return void errorRes(res, "Invalid issuer", 401);
    }

    if (!verified) {
      // TODO more detailed error possible?
      return void errorRes(res, "Unable to verify payload", 401);
    }

    let address;
    try {
      address = await verifyChallengeAndGetAddress(requestBody);
    } catch (error) {
      if (error instanceof VerifyDidChallengeBaseError) {
        return void errorRes(
          res,
          `Invalid challenge signature: ${error.name}`,
          401,
        );
      }

      const { userMessage, systemMessage } = formatExceptionMessages(
        error,
        "Unable to verify challenge signature",
      );

      console.log(systemMessage); // eslint-disable-line no-console

      return void errorRes(res, userMessage, 500);
    }

    payload.address = address;

    // Check signer and type
    const isSigner =
      challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
    const isType =
      challenge.credentialSubject.provider === `challenge-${payload.type}`;

    if (!isSigner || !isType) {
      return void errorRes(
        res,
        "Invalid challenge '" +
          [!isSigner && "signer", !isType && "provider"]
            .filter(Boolean)
            .join("' and '") +
          "'",
        401,
      );
    }

    const types = payload.types.filter((type) => type);
    const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

    const credentials = await verifyProvidersAndIssueCredentials(
      providersGroupedByPlatforms,
      address,
      payload,
    );

    return void res.json(credentials);
  } catch (error: unknown) {
    let baseUserMessage: string;
    let code: number;

    if (error instanceof ApiError) {
      baseUserMessage = error.message;
      code = error.code;
    } else {
      baseUserMessage = "Unable to verify payload";
      code = 500;
    }

    const { userMessage, systemMessage } = formatExceptionMessages(
      error,
      baseUserMessage,
    );

    console.log(systemMessage); // eslint-disable-line no-console

    return void errorRes(res, userMessage, code);
  }
};
