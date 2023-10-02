// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

// Alchemy Api key
export const apiKey = process.env.ALCHEMY_API_KEY;

type GetContractsForOwnerResponse = {
  contracts: any[];
  totalCount: number;
};

export function getNFTEndpoint(): string {
  return `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs`;
}

// Export a NFT Provider
export class NFTProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "NFT";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload owns at least one POAP older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    try {
      const address = (await getAddress(payload)).toLowerCase();

      const errors = [];
      let getContractsForOwnerResponse: GetContractsForOwnerResponse = {
          contracts: [],
          totalCount: 0,
        },
        valid = false,
        record = undefined,
        requestResponse;

      const providerUrl = getNFTEndpoint();
      try {
        requestResponse = await axios.get(providerUrl, {
          params: {
            withMetadata: "false",
            owner: address,
            pageSize: 1,
          },
        });
      } catch (error) {
        errors.push(error);
      }
      getContractsForOwnerResponse = requestResponse.data as GetContractsForOwnerResponse;

      valid = getContractsForOwnerResponse.totalCount > 0;

      if (valid === true) {
        record = {
          address: address,
          "NFT#numNFTsGte": "1",
        };
      } else {
        errors.push(
          `You do not have the required amount of NFTs -- Your NFT count: ${getContractsForOwnerResponse.totalCount}.`
        );
      }

      return Promise.resolve({
        valid,
        errors,
        record,
      });
    } catch (error: unknown) {
      throw new ProviderExternalVerificationError(`NFT check error: ${JSON.stringify(error)}`);
    }
  }
}
