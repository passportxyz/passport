// ---- Types
import { Request, Response } from "express";

import { STAMP_PAGES } from "./stamps.js";

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

export const metadataHandler = (_req: Request, res: Response): void => {
  try {
    const { scorerId } = _req.query;
    if (!scorerId) {
      throw new ApiError("Missing required query parameter `scorerId`", 400);
    }
    // TODO: in the future return specific stamp metadata based on the scorerId
    // TODO: clarify the returned response
    return void res.json(STAMP_PAGES);
  } catch (error) {
    if (error instanceof ApiError) {
      return void errorRes(res, error.message, error.code);
    }
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};
