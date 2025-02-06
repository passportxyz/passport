import { handleAxiosError } from "./handleAxiosError.js";
import { ProviderExternalVerificationError } from "../types.js";

export const handleProviderAxiosError = (error: any, label: string, secretsToHide?: string[]) => {
  return handleAxiosError(error, label, ProviderExternalVerificationError, secretsToHide);
};
