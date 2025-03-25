import { Request } from "express";
import { Response } from "express";
import { CheckRequestBody } from "@gitcoin/passport-types";

import {
  verifyTypes,
  groupProviderTypesByPlatform,
  serverUtils,
} from "../utils/identityHelper.js";

const { ApiError } = serverUtils;

export const checkHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { payload } = req.body as CheckRequestBody;

  if (!payload || !(payload.type || payload.types)) {
    throw new ApiError("Incorrect payload", "BAD_REQUEST");
  }

  const types = (payload.types?.length ? payload.types : [payload.type]).filter(
    (type) => type,
  );

  const typesGroupedByPlatform = groupProviderTypesByPlatform(types);

  const results = await verifyTypes(typesGroupedByPlatform, payload);
  const responses = results.map(({ verifyResult, type, error, code }) => ({
    valid: verifyResult.valid,
    type,
    error,
    code,
  }));
  return void res.json(responses);
};
