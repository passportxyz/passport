import { Request, Response } from "express";

export function getApiKeyFromRequestHeader(req: Request): string {
  if (req.headers["x-api-key"] !== undefined) {
    const ret = req.headers["x-api-key"] as string;
    return ret;
  }

  throw new Error("Unauthorized! No 'X-API-KEY' present in the header!");
}

export function keyGenerator(req: Request, res: Response): string {
  try {
    return getApiKeyFromRequestHeader(req);
  } catch (error) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }

    res.status(401).send({ message });
    throw error;
  }
}
