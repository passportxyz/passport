import { CheckRequestBody, CheckResponseBody } from "@gitcoin/passport-types";

import { verifyTypes, groupProviderTypesByPlatform, serverUtils } from "../utils/identityHelper.js";

const { ApiError, createHandler } = serverUtils;

export const checkHandler = createHandler<CheckRequestBody, CheckResponseBody[]>(async (req, res) => {
  const { payload } = req.body;

  if (!payload || !(payload.type || payload.types)) {
    throw new ApiError("Incorrect payload", "400_BAD_REQUEST");
  }

  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);

  const typesGroupedByPlatform = groupProviderTypesByPlatform(types);

  const { results } = await verifyTypes(typesGroupedByPlatform, payload);
  const responses = results.map(({ verifyResult, type, error, code }) => ({
    valid: verifyResult.valid,
    type,
    error,
    code,
  }));

  return void res.json(responses);
});
