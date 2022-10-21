import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: string;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
};

export type ProviderSpec = {
  title: string;
  name: string;
  icon?: string;
  description?: string;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};

// IAM Types

// All Identity Providers should implement Provider
export interface Provider {
  type: string;
  verify: (payload: RequestPayload, context?: ProviderContext) => Promise<VerifiedPayload>;
}

// Use unknown
export type ProviderOptions = Record<string, unknown>;
