import { Request, Response } from "express";
import { serverUtils } from "./utils/identityHelper.js";
const { ApiError } = serverUtils;

export function keyGenerator(req: Request, _res: Response): string {
  if (req.headers["x-api-key"] !== undefined) {
    const ret = req.headers["x-api-key"] as string;
    return ret;
  }

  throw new ApiError("Unauthorized! No 'X-API-KEY' present in the header!", "401_UNAUTHORIZED");
}
