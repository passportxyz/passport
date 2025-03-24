// ---- Web3 packages
import { isAddress, getAddress } from "ethers";
import * as DIDKit from "@spruceid/didkit-wasm-node";

// ---- Types
import { Response, Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

// All provider exports from platforms
import {
  formatExceptionMessages,
  handleAxiosError,
} from "@gitcoin/passport-platforms";
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
  getChallengeRecord,
  issueChallengeCredential,
  getIssuerInfo,
} from "./utils/identityHelper.js";
import {
  VerifiableCredential,
  VerifyRequestBody,
  ChallengeRequestBody,
  RequestPayload,
  CredentialResponseBody,
} from "@gitcoin/passport-types";
import {
  AutoVerificationFields,
  AutoVerificationRequestBodyType,
  AutoVerificationResponseBodyType,
} from "./handlers.types.js";

import axios from "axios";

const apiKey = process.env.SCORER_API_KEY as string;

export class EmbedAxiosError extends Error {
  constructor(
    public message: string,
    public code: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = 500;
  }
}

// TODO: check if these functions are redundant ... are they also defined in platforms?
// return a JSON error response with a 400 status
export const errorRes = (
  res: Response,
  error: string | object,
  errorCode: number,
): Response => res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addErrorDetailsToMessage = (
  message: string,
  error: any,
): string => {
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
}: AutoVerificationFields & {
  stamps: VerifiableCredential[];
}): Promise<PassportScore> => {
  try {
    const scorerResponse: {
      data?: {
        score?: PassportScore;
      };
    } = await axios.post(
      `${process.env.SCORER_ENDPOINT}/internal/embed/stamps/${address}`,
      {
        stamps,
        scorer_id: scorerId,
      },
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!scorerResponse.data?.score) {
      throw new EmbedAxiosError("No score returned from Scorer Embed API", 500);
    }

    return scorerResponse.data.score;
  } catch (error) {
    handleAxiosError(error, "Scorer Embed API", EmbedAxiosError, [apiKey]);
  }
};

export const autoVerificationHandler = async (
  req: Request<
    ParamsDictionary,
    AutoVerificationResponseBodyType,
    AutoVerificationRequestBodyType
  >,
  res: Response,
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

    const message = addErrorDetailsToMessage(
      "Unexpected error when processing request",
      error,
    );
    return void errorRes(res, message, 500);
  }
};

type EmbedVerifyRequestBody = VerifyRequestBody & {
  scorerId: string;
};

export const verificationHandler = (
  req: Request<
    ParamsDictionary,
    AutoVerificationResponseBodyType,
    EmbedVerifyRequestBody
  >,
  res: Response,
): void => {
  const requestBody: EmbedVerifyRequestBody = req.body;
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const challenge = requestBody.challenge;
  // get the payload from the JSON req body
  const payload = requestBody.payload;
  // get the payload from the JSON req body
  const scorerId = requestBody.scorerId;

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  return void verifyCredential(DIDKit, challenge)
    .then(async (verified): Promise<void> => {
      if (verified && hasValidIssuer(challenge.issuer)) {
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
          throw error;
        }

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

        const types = payload.types?.filter((type) => type) || [];
        const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

        const credentialsVerificationResponses =
          await verifyProvidersAndIssueCredentials(
            providersGroupedByPlatforms,
            address,
            payload,
          );

        const stamps = credentialsVerificationResponses.reduce(
          (acc, response) => {
            if ("credential" in response && response.credential) {
              if (response.credential) {
                acc.push(response.credential);
              }
            }
            return acc;
          },
          [] as VerifiableCredential[],
        );

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

// TODO This is copied from the iam/, should we source it from identity/ or something?
export const getChallengeHandler = async (
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
