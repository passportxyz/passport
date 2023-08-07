// ---- Types
import { Provider, ProviderExternalVerificationError, ProviderInternalVerificationError } from "../types";
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

const UPDATED_PROVIDERS = ["twitterAccountAgeGte#180", "twitterAccountAgeGte#365", "twitterAccountAgeGte#730"];

function inDevEnvironment() {
  // TODO
  return true;
}

function reportUnhandledError(e: unknown) {
  if (inDevEnvironment()) {
    console.error("Unhandled error", e);
    throw e;
  } else {
    // TODO log to datadog and set up alert
    console.error("Unhandled error", e);
  }
}

// Collate all Providers to abstract verify logic
export class Providers {
  // collect providers against instance
  _providers: { [k: string]: Provider } = {};

  // construct an array of providers
  constructor(_providers: Provider[]) {
    // reduce unique entries into _providers object
    this._providers = _providers.reduce((providers, provider) => {
      if (!providers[provider.type]) {
        providers[provider.type] = provider;
      }

      return providers;
    }, {} as { [k: string]: Provider });
  }

  // Given the payload is valid return the response of the selected Providers verification proceedure
  async verify(type: string, payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    if (UPDATED_PROVIDERS.includes(type)) {
      return await this._updatedVerify(type, payload, context);
    }

    // collect provider from options
    const provider = this._providers[type];

    // if a provider is available - use it to verify the payload
    if (provider) {
      // return the verification response
      return await provider.verify(payload, context);
    }

    // unable to verify without provider
    return {
      valid: false,
      error: ["Missing provider"],
    };
  }

  // TODO Once error handling is updated for all providers, rename this to verify
  // and delete the old verify method and the UPDATED_PROVIDERS array
  async _updatedVerify(type: string, payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const provider = this._providers[type];

    if (provider) {
      try {
        return await provider.verify(payload, context);
      } catch (e) {
        if (e instanceof ProviderExternalVerificationError || e instanceof ProviderInternalVerificationError) {
          return {
            valid: false,
            error: [e.message],
          };
        } else {
          reportUnhandledError(e);

          let message =
            "There was an unexpected error during verification, this has been reported to the Gitcoin team.";

          if (e instanceof Error) message += ` ${e.name} ${e.message}`;

          return {
            valid: false,
            error: [message],
          };
        }
      }
    }

    return {
      valid: false,
      error: ["Missing provider"],
    };
  }
}
