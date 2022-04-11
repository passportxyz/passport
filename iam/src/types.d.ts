import { RequestPayload, VerifiedPayload } from "@dpopp/types";

// All Identity Providers should implement Provider
export interface Provider {
  type: string;
  verify: (payload: RequestPayload) => VerifiedPayload;
}

// Use unknown
export type ProviderOptions = Record<string, unknown>;
