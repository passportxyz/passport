// ---- Web3 packages
import { isAddress, getAddress } from "ethers";
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
  getChallenge,
  getIssuerKey,
  issueChallengeCredential,
} from "@gitcoin/passport-identity";
import {
  VerifiableCredential,
  VerifyRequestBody,
  ChallengeRequestBody,
  RequestPayload,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

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

    return scorerResponse.data?.score;
  } catch (error) {
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

type EmbedVerifyRequestBody = VerifyRequestBody & {
  scorerId: string;
};

export const verificationHandler = (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, EmbedVerifyRequestBody>,
  res: Response
): void => {
  console.log("geri ---- verificationHandler");
  const requestBody: EmbedVerifyRequestBody = req.body;
  console.log("geri ---- verificationHandler requestBody", requestBody);
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;
  // get the payload from the JSON req body
  const scorerId = requestBody.scorerId;

  console.log("geri ---- verificationHandler challenge", challenge);
  console.log("geri ---- verificationHandler payload", payload);
  console.log("geri ---- verificationHandler scorerId", scorerId);
  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified): Promise<void> => {
      if (verified && hasValidIssuer(challenge.issuer)) {
        console.log("geri ---- verificationHandler verified", verified);
        let address;
        try {
          address = await verifyChallengeAndGetAddress(requestBody);
        } catch (error) {
          if (error instanceof VerifyDidChallengeBaseError) {
            return void errorRes(res, `Invalid challenge signature: ${error.name}`, 401);
          }
          throw error;
        }

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

        const credentialsVerificationResponses = await verifyProvidersAndIssueCredentials(
          providersGroupedByPlatforms,
          address,
          payload
        );

        console.log("geri ---- verificationHandler credentialsVerificationResponses", credentialsVerificationResponses);
        const stamps = credentialsVerificationResponses.reduce((acc, response) => {
          if ("credential" in response && response.credential) {
            if (response.credential) {
              acc.push(response.credential);
            }
          }
          return acc;
        }, [] as VerifiableCredential[]);

        console.log("geri ---- verificationHandler stamps", stamps);
        const score = await addStampsAndGetScore({ address, scorerId, stamps });

        return void res.json({
          score: score,
          credentials: stamps,
        });
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

export const getChallengeHandler = (
  req: Request<ParamsDictionary, AutoVerificationResponseBodyType, EmbedVerifyRequestBody>,
  res: Response
): void => {
  // get the payload from the JSON req body
  const requestBody: ChallengeRequestBody = req.body as ChallengeRequestBody;
  const payload: RequestPayload = requestBody.payload;

  // check for a valid payload
  if (payload.address && payload.type) {
    // ensure address is check-summed
    payload.address = getAddress(payload.address);
    // generate a challenge for the given payload
    const challenge = getChallenge(payload);
    // if the request is valid then proceed to generate a challenge credential
    if (challenge && challenge.valid === true) {
      // construct a request payload to issue a credential against
      const record: RequestPayload = {
        // add fields to identify the bearer of the challenge
        type: payload.type,
        address: payload.address,
        // version as defined by entry point
        version: "0.0.0",
        // extend/overwrite with record returned from the provider
        ...(challenge?.record || {}),
      };

      const currentKey = getIssuerKey(payload.signatureType);
      // generate a VC for the given payload
      return void issueChallengeCredential(DIDKit, currentKey, record, payload.signatureType)
        .then((credential) => {
          // return the verifiable credential
          return res.json(credential as CredentialResponseBody);
        })
        .catch((error) => {
          if (error) {
            // return error msg indicating a failure producing VC
            return void errorRes(res, "Unable to produce a verifiable credential", 400);
          }
        });
    } else {
      // return error message if an error present
      // limit the error message string to 1000 chars
      return void errorRes(
        res,
        (challenge.error && challenge.error.join(", ").substring(0, 1000)) || "Unable to verify proofs",
        403
      );
    }
  }

  if (!payload.address) {
    return void errorRes(res, "Missing address from challenge request body", 400);
  }

  if (!payload.type) {
    return void errorRes(res, "Missing type from challenge request body", 400);
  }
};
