// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

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
