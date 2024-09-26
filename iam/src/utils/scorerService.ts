import axios from "axios";
import { Score } from "./easStampSchema";
import { handleAxiosError } from "@gitcoin/passport-platforms";

const scorerApiGetScore = `${process.env.SCORER_ENDPOINT}/registry/score/${process.env.ALLO_SCORER_ID}`;

export class IAMError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

type GetScoreResponse = {
  data: {
    status: string;
    evidence: {
      rawScore: string;
    };
  };
};

// Use public endpoint and static api key to fetch score
export async function fetchPassportScore(address: string, customScorerId?: number): Promise<Score> {
  const response = await requestScore(address);

  const { data } = response;
  if (data.status !== "DONE") {
    throw new IAMError(`Score not ready yet. Status: ${data.status}`);
  }

  const scorer_id = customScorerId || Number(process.env.ALLO_SCORER_ID);

  const score: Score = {
    score: Number(data.evidence.rawScore),
    scorer_id,
  };

  return score;
}

async function requestScore(address: string): Promise<GetScoreResponse> {
  const apiKey = process.env.SCORER_API_KEY;

  try {
    return await axios.get(`${scorerApiGetScore}/${address}`, {
      headers: {
        "X-API-Key": apiKey,
      },
    });
  } catch (error) {
    handleAxiosError(error, "Passport score", IAMError, [apiKey]);
  }
}
