// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { snapshotGraphQLDatabase } from "./snapshotProposalsProvider";

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
  votedOnGTETwoProposals: boolean;
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
    let valid = false,
      verifiedPayload = {
        votedOnGTETwoProposals: false,
      };

    try {
      verifiedPayload = await checkForSnapshotVotes(snapshotGraphQLDatabase, address);

      valid = address && verifiedPayload.votedOnGTETwoProposals ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
            hasVotedOnGTE2SnapshotProposals: String(valid),
          }
        : undefined,
    });
  }
}

const checkForSnapshotVotes = async (url: string, address: string): Promise<SnapshotVotesCheckResult> => {
  let votedOnGTETwoProposals = false;
  let result: VotesQueryResponse;

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
    const error = e as { response: { data: { message: string } } };
    throw `The following error is being thrown: ${error.response.data.message}`;
  }

  const votes = result.data.data.votes;

  // Check to see if the user has voted on 2 or more DAO proposals, and if they have
  // set votedOnGTETwoProposals = true
  if (votes.length >= 2) {
    votedOnGTETwoProposals = true;
  }

  // Return false by default (if the proposals array is empty or there is no
  // matching verification)
  return {
    votedOnGTETwoProposals,
  };
};
