// ---- Types
import { Provider, ProviderExternalVerificationError, ProviderInternalVerificationError } from "../types";
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

function reportUnhandledError(type: string, address: string, e: unknown) {
  if (process.env.EXIT_ON_UNHANDLED_ERROR === "true" && process.env.NODE_ENV === "development") {
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

  async verify(type: string, payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const provider = this._providers[type];

    if (provider) {
      try {
        const result = await provider.verify(payload, context);
        if (!result.valid && !result.errors) {
          reportUnhandledError(type, payload.address, new Error("No reason provided for invalid payload"));
        }
        return result;
      } catch (e) {
        if (e instanceof ProviderExternalVerificationError || e instanceof ProviderInternalVerificationError) {
          return {
            valid: false,
            // Also consider maybe not using error/errors as a key within the verification,
            // but instead have a new "details" array which would really be more about
            // "details of why you are not verified" which should be separated from
            // the concept of "errors". The "error" key would only be set here
            errors: [e.message],
          };
        } else {
          reportUnhandledError(type, payload.address, e);

          let message = "There was an unexpected error during verification.";

          // The first line of the stack contains the error name and message. We'll keep this
          // and the second line, the lowest level of the backtrace. The rest is dropped.
          if (e instanceof Error) message += ` ${e.stack.replace(/\n\s*(?= )/, "").replace(/\n.*$/gm, "")}`;

          return {
            valid: false,
            errors: [message],
          };
        }
      }
    }

    return {
      valid: false,
      errors: ["Missing provider"],
    };
  }
}
