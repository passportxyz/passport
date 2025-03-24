// ---- Types
import {
  Provider,
  ProviderExternalVerificationError,
  ProviderInternalVerificationError,
} from "../types.js";
import type {
  RequestPayload,
  VerifiedPayload,
  ProviderContext,
} from "@gitcoin/passport-types";
import { formatExceptionMessages } from "./errors.js";

class NoFailureReasonError extends Error {
  constructor() {
    super("No failure reason provided");
    this.name = "NoFailureReasonError";
  }
}

function reportUnhandledError(
  type: string,
  address: string,
  error: unknown,
  errorMessage: string,
) {
  if (
    process.env.EXIT_ON_UNHANDLED_ERROR === "true" &&
    process.env.NODE_ENV === "development"
  ) {
    // To be used when running locally to ensure that unhandled errors are fixed
    console.error(`Unhandled error for type ${type}`, error);
    process.exit(1);
  } else {
    console.error(
      `UNHANDLED ERROR: for type ${type} and address ${address} -`,
      errorMessage,
    );
  }
}

export const withTimeout = async (
  millis: number,
  promise: Promise<VerifiedPayload>,
  type: string,
): Promise<VerifiedPayload> => {
  let timeoutPid: NodeJS.Timeout | null = null;
  const timeout = new Promise<VerifiedPayload>(
    (_resolve, reject) =>
      (timeoutPid = setTimeout(() => {
        reject(
          new ProviderExternalVerificationError(
            `Request timeout while verifying ${type}. It took over ${millis} ms to complete.`,
          ),
        );
      }, millis)),
  );
  const result = await Promise.race([promise, timeout]);
  clearTimeout(timeoutPid);
  return result;
};

// Collate all Providers to abstract verify logic
export class Providers {
  // collect providers against instance
  _providers: { [k: string]: Provider } = {};

  // construct an array of providers
  constructor(_providers: Provider[]) {
    // reduce unique entries into _providers object
    this._providers = _providers.reduce(
      (providers, provider) => {
        if (!providers[provider.type]) {
          providers[provider.type] = provider;
        }

        return providers;
      },
      {} as { [k: string]: Provider },
    );
  }

  async verify(
    type: string,
    payload: RequestPayload,
    context: ProviderContext,
  ): Promise<VerifiedPayload> {
    const provider = this._providers[type];

    if (provider) {
      try {
        const result = await withTimeout(
          30000,
          provider.verify(payload, context),
          type,
        );
        if (!result.valid && !result.errors) {
          const error = new NoFailureReasonError();
          const { systemMessage } = formatExceptionMessages(
            error,
            "No failure reason provided",
          );
          reportUnhandledError(type, payload.address, error, systemMessage);
        }
        return result;
      } catch (e) {
        if (
          e instanceof ProviderExternalVerificationError ||
          e instanceof ProviderInternalVerificationError
        ) {
          return {
            valid: false,
            // Also consider maybe not using error/errors as a key within the verification,
            // but instead have a new "details" array which would really be more about
            // "details of why you are not verified" which should be separated from
            // the concept of "errors". The "error" key would only be set here
            errors: [e.message],
          };
        } else {
          let baseUserMessage =
            "An error occurred while verifying your account";
          // The first line of the stack contains the error name and message. We'll keep this
          // and the second line, the lowest level of the backtrace. The rest is dropped.
          if (e instanceof Error)
            baseUserMessage += ` ${e.stack.replace(/\n\s*(?= )/, "").replace(/\n.*$/gm, "")}`;

          const { systemMessage, userMessage } = formatExceptionMessages(
            e,
            baseUserMessage,
          );
          reportUnhandledError(type, payload.address, e, systemMessage);

          return {
            valid: false,
            errors: [userMessage],
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
