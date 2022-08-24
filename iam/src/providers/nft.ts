// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../utils/signer";

// Alchemy Api key
export const apiKey = process.env.ALCHEMY_API_KEY;
export const alchemyGetNFTsUrl = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs`;

type NFTsResponse = {
  ownedNfts: [];
  totalCount: number;
};

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
    console.log("geri - verify", payload);
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();

    console.log("geri - address");
    let valid = false;
    let nftsResponse: NFTsResponse = {
      ownedNfts: [],
      totalCount: 0,
    };

    try {
      console.log("geri - making request");
      const requestResponse = await axios.get(alchemyGetNFTsUrl, {
        params: {
          withMetadata: "false",
          owner: address,
        },
      });

      if (requestResponse.status == 200) {
        nftsResponse = requestResponse.data as NFTsResponse;

        console.log("geri - nftsResponse", nftsResponse);
        valid = nftsResponse.totalCount > 0;
      }
    } catch (error) {
      // Nothing to do here, valid will remain false
    }

    console.log("geri - valid", valid);
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            numTotalNFTs: nftsResponse.totalCount.toString(),
          }
        : undefined,
    });
  }
}
