import { Request } from "express";
import { Response } from "express";
import { CheckRequestBody } from "@gitcoin/passport-types";

import {
  verifyTypes,
  groupProviderTypesByPlatform,
} from "../utils/identityHelper.js";
import { errorRes } from "../utils/helpers.js";
import { formatExceptionMessages } from "@gitcoin/passport-platforms";

export const checkHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { payload } = req.body as CheckRequestBody;

  if (!payload || !(payload.type || payload.types)) {
    return void errorRes(res, "Incorrect payload", 400);
  }

  const types = (payload.types?.length ? payload.types : [payload.type]).filter(
    (type) => type,
  );

  const typesGroupedByPlatform = groupProviderTypesByPlatform(types);

  try {
    const results = await verifyTypes(typesGroupedByPlatform, payload);
    const responses = results.map(({ verifyResult, type, error, code }) => ({
      valid: verifyResult.valid,
      type,
      error,
      code,
    }));
    return void res.json(responses);
  } catch (error) {
    const { userMessage, systemMessage } = formatExceptionMessages(
      error,
      "Unable to check payload",
    );

    // TODO Is this what we want to do? Do we want to add any additional context?
    console.log(systemMessage); // eslint-disable-line no-console

    return void errorRes(res, userMessage, 500);
  }
};
