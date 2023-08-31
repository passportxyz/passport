// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider } from "../../types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

type Claim = {
  creation: string;
  owner: string;
  creator: string;
};

type ClaimToken = {
  claim: Claim;
};

type ClaimTokensResponse = {
  claimTokens: ClaimToken[];
};

type CheckTokensResult = {
  numTokensTooNew: number;
  numTokensCreatedByOwner: number;
  numValidTokens: number;
};

export class HypercertsProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Hypercerts";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let errors: string[] = [];

    const address = payload.address.toLocaleLowerCase();

    const claimTokens = await this.requestClaimTokens(address);
    console.log("claimTokens", claimTokens);
    const { numValidTokens, numTokensTooNew, numTokensCreatedByOwner } = this.checkTokens(claimTokens);

    if (numValidTokens >= 2) {
      valid = true;
    } else {
      let message = `You have ${numValidTokens} valid Hypercerts and the minimum is 2.`;
      if (numTokensCreatedByOwner > 0) {
        message += ` ${numTokensCreatedByOwner} Hypercerts were ignored because you created them yourself.`;
      }
      if (numTokensTooNew > 0) {
        message += ` ${numTokensTooNew} Hypercerts were ignored because they were created less than 15 days ago.`;
      }
      errors = [message];
    }

    return {
      valid,
      errors,
      record: {
        address,
      },
    };
  }

  async requestClaimTokens(address: string): Promise<ClaimToken[]> {
    try {
      const url = "https://api.thegraph.com/subgraphs/name/hypercerts-admin/hypercerts-optimism-mainnet";
      const result: {
        data: {
          data: ClaimTokensResponse;
        };
      } = await axios.post(url, {
        query: `
          query ($owner: Bytes) {
            claimTokens(where: {owner: $owner}) {
              claim {
                creation
                creator
                owner
              }
            }
          }
        `,
        variables: {
          owner: address,
        },
      });

      return result?.data?.data?.claimTokens || [];
    } catch (error) {
      handleProviderAxiosError(error, "Hypercerts");
    }
  }

  checkTokens(claimTokens: ClaimToken[]): CheckTokensResult {
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    let numTokensTooNew = 0;
    let numTokensCreatedByOwner = 0;
    let numValidTokens = 0;

    claimTokens.forEach(({ claim: { creation, creator, owner } }) => {
      if (creator === owner) {
        numTokensCreatedByOwner++;
      } else if (Number(creation) * 1000 > fifteenDaysAgo) {
        numTokensTooNew++;
      } else {
        numValidTokens++;
      }
    });

    return {
      numTokensTooNew,
      numTokensCreatedByOwner,
      numValidTokens,
    };
  }
}
