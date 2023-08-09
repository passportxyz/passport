// ---- Types
import { Provider, ProviderExternalVerificationError, ProviderInternalVerificationError } from "../types";
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

const UPDATED_PROVIDERS = ["twitterAccountAgeGte#180", "twitterAccountAgeGte#365", "twitterAccountAgeGte#730"];

function reportUnhandledError(type: string, address: string, e: unknown) {
  if (process.env.EXIT_ON_UNHANDLED_ERROR === "true") {
    // To be used when running locally to ensure that unhandled errors are fixed
    console.error(`Unhandled error for type ${type}`, e);
    process.exit(1);
  } else {
    let errorMessage = "unable to parse, not derived from Error";
    if (e instanceof Error) {
      // Don't log the message (or first line of stack) as it may contain PII
      errorMessage = `${e.name} ${e.stack.replace(/^.*\n *(?=at)/m, "")}`;
    }
    console.error(`UNHANDLED ERROR: for type ${type} and address ${address} -`, errorMessage);
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
      try {
        // return the verification response
        return await provider.verify(payload, context);
      } catch (e) {
        if (e instanceof Error) {
          const message = `Unable to verify provider: ${e.stack.replace(/\n\s*(?= )/, "").replace(/\n.*$/gm, "")}`;

          return {
            valid: false,
            error: [message],
          };
        }
        throw e;
      }
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
        const result = await provider.verify(payload, context);
        if (!result.valid && (!result.errors || result.errors.length === 0)) {
          reportUnhandledError(type, payload.address, new Error("No reason provided for invalid payload"));
        }
        return result;
      } catch (e) {
        if (e instanceof ProviderExternalVerificationError || e instanceof ProviderInternalVerificationError) {
          return {
            valid: false,
            // TODO change to "errors" once everything is updated
            error: [e.message],
          };
        } else {
          reportUnhandledError(type, payload.address, e);

          let message = "There was an unexpected error during verification.";

          if (e instanceof Error) message += ` ${e.stack.replace(/\n\s*(?= )/, "").replace(/\n.*$/gm, "")}`;

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
