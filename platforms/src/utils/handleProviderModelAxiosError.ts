import axios from "axios";
import { ProviderBackendError, ProviderExternalVerificationError } from "../types.js";
import { handleAxiosError } from "./handleAxiosError.js";

// 5xx responses and "no response received" (timeouts, connection refused, DNS
// failures) indicate the upstream model service is down or unreachable. Throwing
// ProviderBackendError — which does NOT extend ProviderVerificationError — bypasses
// the instanceof check in utils/providers.ts so the error reaches reportUnhandledError
// and surfaces in ops logs instead of being silently dropped. 4xx responses are
// treated as ProviderExternalVerificationError (client-side issue with the request).
export const handleProviderModelAxiosError = (error: any, label: string, secretsToHide?: string[]) => {
  if (axios.isAxiosError(error)) {
    const isBackendFailure = !error.response || error.response.status >= 500;
    const ErrorClass = isBackendFailure ? ProviderBackendError : ProviderExternalVerificationError;
    return handleAxiosError(error, label, ErrorClass, secretsToHide);
  }
  throw error;
};
