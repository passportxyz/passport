import { handleAxiosError } from "@gitcoin/passport-identity";
import { ProviderExternalVerificationError } from "../types";

export const handleProviderAxiosError = (error: any, label: string, secretsToHide?: string[]) => {
  return handleAxiosError(error, label, ProviderExternalVerificationError, secretsToHide);
};
