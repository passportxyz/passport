/* eslint-disable */
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

export type Proofs = { [k: string]: string };

export type CallbackParameters = {
  proofs?: Proofs;
  authenticated: boolean;
};

export type AccessTokenResult = {
  proofs?: Proofs;
  authenticated: boolean;
};

export enum AuthType {
  Token,
  Window,
  Null,
}

export interface Platform {
  platformId: string;
  path?: string;
  authType?: AuthType;
  getOAuthUrl?(state: string): Promise<string>;
  getProviderProof?(): Promise<AccessTokenResult>;
}

export type PlatformOptions = Record<string, unknown>;
