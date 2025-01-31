// ---- Web3 packages
import { isAddress } from "ethers";
import * as DIDKit from "@spruceid/didkit-wasm-node";

// ---- Types
import { Response, Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

// All provider exports from platforms
import { handleAxiosError } from "@gitcoin/passport-platforms";
import {
  autoVerifyStamps,
  PassportScore,
  verifyCredential,
  hasValidIssuer,
  verifyChallengeAndGetAddress,
  VerifyDidChallengeBaseError,
  helpers,
  groupProviderTypesByPlatform,
  verifyProvidersAndIssueCredentials,
} from "@gitcoin/passport-identity";
import { VerifiableCredential, VerifyRequestBody } from "@gitcoin/passport-types";

import axios from "axios";

const apiKey = process.env.SCORER_API_KEY;

export type PassportProviderPoints = {
  score: string;
  dedup: boolean;
  expiration_date: string;
};

export type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
  credentialIds?: [];
};

type AutoVerificationFields = AutoVerificationRequestBodyType;

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

export class EmbedAxiosError extends Error {
  constructor(
    public message: string,
    public code: number
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = 500;
  }
}

// TODO: check if these functions are redundant ... are they also defined in platforms?
// return a JSON error response with a 400 status
export const errorRes = (res: Response, error: string | object, errorCode: number): Response =>
  res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addErrorDetailsToMessage = (message: string, error: any): string => {
  if (error instanceof EmbedAxiosError || error instanceof Error) {
    message += `, ${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    message += `, ${error}`;
  }
  return message;
};

export const addStampsAndGetScore = async ({
  address,
  scorerId,
  stamps,
}: AutoVerificationFields & { stamps: VerifiableCredential[] }): Promise<PassportScore> => {
  console.log("geri ---- addStampsAndGetScore");
  try {
    const scorerResponse: {
      data?: {
        score?: PassportScore;
      };
    } = await axios.post(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/${address}`,
      {
        stamps,
        scorer_id: scorerId,
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    console.log("geri ---- scorerResponse", scorerResponse);
    return scorerResponse.data?.score;
  } catch (error) {
    console.log("geri ---- scorerResponse error", error);
    handleAxiosError(error, "Scorer Embed API", EmbedAxiosError, [apiKey]);
  }
};

export const autoVerificationHandler = async (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
  res: Response
): Promise<void> => {
  try {
    const { address, scorerId, credentialIds } = req.body;

    if (!isAddress(address)) {
      return void errorRes(res, "Invalid address", 400);
    }

    const stamps = await autoVerifyStamps({ address, scorerId, credentialIds });

    const score = await addStampsAndGetScore({ address, scorerId, stamps });

    // TODO should we issue a score VC?
    return void res.json(score);
  } catch (error) {
    if (error instanceof EmbedAxiosError) {
      return void errorRes(res, error.message, error.code);
    }

    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};

export const verificationHandler = (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, VerifyRequestBody>,
  res: Response
): void => {
  const requestBody: VerifyRequestBody = req.body;
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified): Promise<void> => {
      if (verified && hasValidIssuer(challenge.issuer)) {
        let address;
        try {
          address = await verifyChallengeAndGetAddress(requestBody);
        } catch (error) {
          if (error instanceof VerifyDidChallengeBaseError) {
            return void errorRes(res, `Invalid challenge signature: ${error.name}`, 401);
          }
          throw error;
        }

        payload.address = address;

        // Check signer and type
        const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
        const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

        if (!isSigner || !isType) {
          return void errorRes(
            res,
            "Invalid challenge '" +
              [!isSigner && "signer", !isType && "provider"].filter(Boolean).join("' and '") +
              "'",
            401
          );
        }

        const types = payload.types.filter((type) => type);
        const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

        const credentials = await verifyProvidersAndIssueCredentials(providersGroupedByPlatforms, address, payload);

        return void res.json(credentials);
      }

      // error response
      return void errorRes(res, "Unable to verify payload", 401);
    })
    .catch((error): void => {
      if (error instanceof helpers.ApiError) {
        return void errorRes(res, error.message, error.code);
      }
      let message = "Unable to verify payload";
      if (error instanceof Error) message += `: ${error.name}`;
      return void errorRes(res, message, 500);
    });
};
