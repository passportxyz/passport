/* eslint-disable */
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
  enablePlatformCardUpdate?: boolean;
  website: string;
};

export type ProviderSpec = {
  title: string;
  name: PROVIDER_ID;
  hash?: string;
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

export type ProviderPayload = Record<string, unknown>;

export type CacheToken = string;

export type AppContext = {
  state: string;
  window: {
    open: (url: string, target: string, features: string) => void;
  };
  screen: {
    width: number;
    height: number;
  };
  userDid?: string;
  callbackUrl?: string;
  selectedProviders: PROVIDER_ID[]; // can be used to translate to a scope when making an oauth request
  waitForRedirect(timeout?: number): Promise<ProviderPayload>;
};

export interface Platform {
  platformId: string;
  path?: string;
  banner?: {
    heading?: string;
    content?: string;
    cta?: {
      label: string;
      url: string;
    };
  };
  isEVM?: boolean;
  getOAuthUrl?(state: string): Promise<string>;
  getProviderPayload(appContext: AppContext): Promise<ProviderPayload>;
}

export type PlatformOptions = Record<string, unknown>;
