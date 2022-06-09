// ---- Types
import type { Provider } from "../types";
import type { RequestPayload, ChallengePayload, VerifiedPayload } from "@gitcoin/passport-types";

// ---- Return randomBytes as a challenge to test that the user has control of a provided address
import crypto from "crypto";

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

  // request a challenge sig
  getChallenge(payload: RequestPayload): ChallengePayload {
    // @TODO - expand this to allow providers to set custom challanges?

    // check that we've been provided an address for the challenge
    if (payload.address) {
      // valid payload - create a challenge string
      return {
        valid: true,
        record: {
          address: payload.address,
          type: payload.type,
          challenge: `I commit that this stamp is my unique and only ${
            payload.type
          } verification for Passport.\n\nnonce: ${crypto.randomBytes(32).toString("hex")}`,
        },
      };
    } else {
      // unable to create a challenge without address
      return {
        valid: false,
        error: ["Missing address"],
      };
    }
  }

  // Given the payload is valid return the response of the selected Providers verification proceedure
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // collect provider from options
    const provider = this._providers[payload.type];

    // if a provider is available - use it to verify the payload
    if (provider) {
      // return the verification response
      return await provider.verify(payload);
    }

    // unable to verify without provider
    return {
      valid: false,
      error: ["Missing provider"],
    };
  }
}
