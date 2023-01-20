// ---- Types
import type { Provider } from "../types";
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

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
}
