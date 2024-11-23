import { CredentialResponseBody, RequestPayload } from "@gitcoin/passport-types";
import { ApiError, issueCredentials } from "./autoVerification";

export const checkConditionsAndIssueCredentials = async (
  payload: RequestPayload,
  address: string
): Promise<CredentialResponseBody[] | CredentialResponseBody> => {
  const singleType = !payload.types?.length;
  const types = (!singleType ? payload.types : [payload.type]).filter((type) => type);

  // Validate requirements and issue credentials
  if (payload && payload.type) {
    const responses = await issueCredentials(types, address, payload);

    if (singleType) {
      const response = responses[0];
      if ("error" in response && response.code && response.error) {
        throw new ApiError(response.error, response.code);
      }
      return response;
    }
    return responses;
  }

  throw new ApiError("Invalid payload", 400);
};
