// ---- Web3 packages
import { isAddress } from "ethers";

// ---- Types
import { Response, Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";

// All provider exports from platforms
import { handleAxiosError } from "@gitcoin/passport-platforms";
import { autoVerifyStamps } from "@gitcoin/passport-identity/dist/commonjs/identity/src/index.js";
import { VerifiableCredential } from "@gitcoin/passport-types";

import axios from "axios";

const apiKey = process.env.SCORER_API_KEY;

export type PassportProviderPoints = {
  score: string;
  dedup: boolean;
  expiration_date: string;
};

export type PassportScore = {
  address: string;
  score: string;
  passing_score: boolean;
  last_score_timestamp: string;
  expiration_timestamp: string;
  threshold: string;
  error: string;
  stamps: Record<string, PassportProviderPoints>;
};

export type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
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
    const { address, scorerId } = req.body;

    if (!isAddress(address)) {
      return void errorRes(res, "Invalid address", 400);
    }

    const stamps = await autoVerifyStamps({ address, scorerId });

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
