import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// All Identity Providers should implement Provider
export interface Provider {
  type: string;
  verify: (payload: RequestPayload) => Promise<VerifiedPayload>;
}

// Use unknown
export type ProviderOptions = Record<string, unknown>;
