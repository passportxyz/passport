/* eslint-disable */
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Address, SignMessageReturnType } from "viem";

import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { Platform as PlatformClass } from "./utils/platform.js";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
  enablePlatformCardUpdate?: boolean;
  website?: string;
  timeToGet?: string;
  price?: string;
  guide?: GuideSection[]; // Guide sections supporting steps, lists, etc.
  cta?: StepAction; // Optional custom call-to-action
};

export type ProviderSpec = {
  title: string;
  name: PROVIDER_ID;
  hash?: string;
  icon?: string;
  description?: string;
  isDeprecated?: boolean;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};

class ProviderVerificationError extends Error {
  constructor(message: string) {
    super(message);
    if (this.constructor === ProviderVerificationError) {
      throw new Error("ProviderVerificationError is an abstract class and cannot be instantiated directly.");
    }
    this.name = this.constructor.name;
  }
}

export class ProviderExternalVerificationError extends ProviderVerificationError {
  constructor(message: string) {
    super(message);
  }
}

export class ProviderInternalVerificationError extends ProviderVerificationError {
  constructor(message: string) {
    super(message);
  }
}

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
  waitForRedirect(platform: PlatformClass, timeout?: number): Promise<ProviderPayload>;

  // Optional properties for EVM platforms that need wallet functionality
  address?: string;
  signMessageAsync?: ({ message }: { message: string }) => Promise<string>;
  sendTransactionAsync?: (variables: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }) => Promise<`0x${string}`>;
  switchChainAsync?: ({ chainId }: { chainId: number }) => Promise<any>;
};

export type PlatformBanner = {
  heading?: React.ReactNode;
  content?: React.ReactNode;
  cta?: {
    label: string;
    url: string;
  };
};

export interface Platform {
  platformId: string;
  path?: string;
  banner?: PlatformBanner;
  getOAuthUrl?(state: string): Promise<string>;
  getProviderPayload(appContext: AppContext): Promise<ProviderPayload>;
}

// Step item for step-by-step guides
export interface StepItem {
  title: string;
  description: string;
  actions?: StepAction[];
  image?: {
    src: string;
    alt: string;
  };
}

// Guide sections with discriminated union
export type GuideSection =
  | {
      type: "steps";
      title?: string; // defaults to "Step-by-Step Guide"
      items: StepItem[];
    }
  | {
      type: "list";
      title?: string; // defaults to "Important considerations"
      items: string[];
      actions?: StepAction[];
    };

export type StepAction =
  | {
      label: string;
      href: string; // For external links
    }
  | {
      label: string;
      onClick: ({
        address,
        signMessageAsync,
        sendTransactionAsync,
        switchChainAsync,
      }: {
        address: Address;
        signMessageAsync: ({ message }: { message: string }) => Promise<SignMessageReturnType>;
        sendTransactionAsync: (variables: {
          to: `0x${string}`;
          value?: bigint;
          data?: `0x${string}`;
          gas?: bigint;
          gasPrice?: bigint;
          maxFeePerGas?: bigint;
          maxPriorityFeePerGas?: bigint;
        }) => Promise<`0x${string}`>;
        switchChainAsync: (params: { chainId: number }) => Promise<any>;
      }) => void | Promise<void>; // For internal actions
    };

export type PlatformOptions = Record<string, unknown>;
