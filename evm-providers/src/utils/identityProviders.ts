import { ProviderContext } from "@gitcoin/passport-types";
import { Signer } from "ethers";

export type ProviderPayload = {
  address?: string;
  signer?: Signer;
};

export type VerifiedProvider = {
  type: string;
  verify(payload: ProviderPayload, context?: ProviderContext): VerifiedPayload | PromiseLike<VerifiedPayload>;
};
export type VerifiedPayload = {
  valid: boolean;
  error?: string[];
  // This will be combined with the ProofRecord (built from the verified content in the Payload)
  record?: { [k: string]: string };
};

export class IdentityProviders {
  // collect providers against instance
  _providers: { [k: string]: VerifiedProvider } = {};

  // construct an array of providers
  constructor(_providers: VerifiedProvider[]) {
    // reduce unique entries into _providers object
    this._providers = _providers.reduce((providers, provider) => {
      if (!providers[provider.type]) {
        providers[provider.type] = provider;
      }

      return providers;
    }, {} as { [k: string]: VerifiedProvider });
  }

  // Given the payload is valid return the response of the selected Providers verification proceedure
  async verify(type: string, payload: ProviderPayload): Promise<VerifiedPayload> {
    // collect provider from options
    const provider = this._providers[type];

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
