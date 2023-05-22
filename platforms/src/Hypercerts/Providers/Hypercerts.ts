// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider } from "../../types";

// ----- Libs
import axios from "axios";

type Claim = {
  id: string;
  creation: string;
  uri: string;
  totalUnits: string;
};

type ClaimToken = {
  id: string;
  owner: string;
  tokenID: string;
  units: string;
  claim: Claim;
};

type ClaimTokensResponse = {
  claimTokens: ClaimToken[];
};

export class GuildMemberProvider implements Provider {
  type: string;
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const url = "https://api.thegraph.com/subgraphs/name/hypercerts-admin/hypercerts-optimism-mainnet";
      const address = payload.address.toLocaleLowerCase();

      const result: {
        data: {
          data: ClaimTokensResponse;
        };
      } = await axios.post(url, {
        query: `
          query ($owner: Bytes) {
            claimTokens(where: {owner: $owner}) {
              id
              owner
              tokenID
              units
              claim {
                id
                creation
                uri
                totalUnits
              }
            }
          }
        `,
        variables: {
          owner: "0x0636f974d29d947d4946b2091d769ec6d2d415de",
        },
      });

      const claimedTokens = result.data.data.claimTokens;

      return {
        valid: claimedTokens.length > 0,
        record: {
          address,
        },
      };
    } catch (e: unknown) {
      const error = e as { response: { data: { message: string } } };
      throw `The following error is being thrown: ${error.response.data.message}`;
    }
  }
}
