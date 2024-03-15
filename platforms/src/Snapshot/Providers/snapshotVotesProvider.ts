// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { snapshotGraphQLDatabase } from "./snapshotProposalsProvider";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

// Defining interfaces for the data structure returned by the Snapshot graphQL DB
interface VotesQueryResponse {
  data?: {
    data?: SnapshotVotesQueryResult;
  };
  status?: number;
}

interface SnapshotVotesQueryResult {
  votes?: [
    id?: string,
    voter?: string,
    proposal?: {
      id?: string;
    },
    space?: {
      id?: string;
    }
  ];
}

type SnapshotVotesCheckResult = {
  valid: boolean;
  errors?: string[];
};

// Export a Snapshot Votes Provider
export class SnapshotVotesProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "SnapshotVotesProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in has voted on 2 or more DAO proposals
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();

    try {
      const { valid, errors } = await checkForSnapshotVotes(snapshotGraphQLDatabase, address);
      return Promise.resolve({
        valid,
        errors,
        record: {
          address,
          votedOnGTETwoProposals: String(valid),
        },
      });
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Snapshot proposal votes: ${JSON.stringify(e)}`);
    }
  }
}

const checkForSnapshotVotes = async (url: string, address: string): Promise<SnapshotVotesCheckResult> => {
  let result: VotesQueryResponse;
  let voteCount = 0;

  // Query the Snapshot graphQL DB
  try {
    result = await axios.post(url, {
      query: `
        query Votes {
          votes (
            where: {
              voter: "${address}"
            }
          ) {
            proposal {
              id
            }
            space {
              id
            }
          }
        }`,
    });
  } catch (e: unknown) {
    handleProviderAxiosError(e, "Snapshot Votes error", [address]);
  }

  const votes = result.data.data.votes;
  voteCount = votes.length;

  // Check to see if the user has voted on 2 or more DAO proposals, and if they have
  // set votedOnGTETwoProposals = true
  if (voteCount >= 2) {
    return {
      valid: true,
      errors: undefined,
    };
  } else {
    // Return false by default (if the proposals array is empty or there is no
    // matching verification)
    return {
      valid: false,
      errors: [`Snapshot proposal votes is ${voteCount}, which is less than required 2 per proposal.`],
    };
  }
};
