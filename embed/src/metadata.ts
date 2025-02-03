// ---- Types
import { Request, Response } from "express";

import { STAMP_PAGES, displayNumber } from "./stamps.js";
import { platforms } from "@gitcoin/passport-platforms";
import axios from "axios";
export class IAMError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// return a JSON error response with a 400 status
export const errorRes = (res: Response, error: string | object, errorCode: number): Response =>
  res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addErrorDetailsToMessage = (message: string, error: any): string => {
  if (error instanceof IAMError || error instanceof Error) {
    message += `, ${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    message += `, ${error}`;
  }
  return message;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public code: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const metadataHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { scorerId } = _req.query;
    if (!scorerId) {
      throw new ApiError("Missing required query parameter: `scorerId`", 400);
    }
    // TODO: in the future return specific stamp metadata based on the scorerId
    // TODO: clarify the returned response
    // get weight for scorerId
    const embedWeightsUrl = `${process.env.SCORER_ENDPOINT}/embed/weights?community_id=${scorerId as string}`;
    const weightsResponse = await axios.get(embedWeightsUrl);
    const weightsResponseData: { [key: string]: number } = weightsResponse.data as { [key: string]: number };

    // get providers / credential ids from passport-platforms
    // for each provider, get the weight from the weights response
    const updatedStampPages = STAMP_PAGES.map((stampPage) => ({
      ...stampPage,
      platforms: stampPage.platforms.map((platform) => {
        const platformName = platform.name;
        const platformData = platforms[platformName];

        if (!platformData || !platformData.providers) {
          return {
            ...platform,
            credentials: [],
            displayWeight: displayNumber(0),
          };
        }
        // Extract provider types
        const providers = platformData.providers;
        const credentials = Object.values(providers).map((provider: { type: string }) => ({
          id: provider.type,
          weight: weightsResponseData[provider.type] ? weightsResponseData[provider.type].toString() : "0",
        }));
        return {
          ...platform,
          credentials,
          displayWeight: displayNumber(credentials.reduce((acc, credential) => acc + parseFloat(credential.weight), 0)),
        };
      }),
    }));

    return void res.json(updatedStampPages);
  } catch (error) {
    if (error instanceof ApiError) {
      return void errorRes(res, error.message, error.code);
    }
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};
