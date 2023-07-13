import axios from "axios";
import { Score } from "./easStampSchema";

const scorerApiGetScore = `${process.env.SCORER_ENDPOINT}/registry/score/${process.env.ALLO_SCORER_ID}`;
// Use public endpoint and static api key to fetch score
export async function fetchPassportScore(address: string): Promise<Score> {
  try {
    const response: {
      data: {
        status: string;
        evidence: {
          rawScore: string;
        };
      };
    } = await axios.get(`${scorerApiGetScore}/${address}`, {
      headers: {
        "X-API-Key": process.env.SCORER_API_KEY,
      },
    });

    const { data } = response;

    if (data.status !== "DONE") {
      throw new Error(`Score not ready yet. Status: ${data.status}`);
    }

    const score: Score = {
      score: Number(data.evidence.rawScore),
      scorer_id: Number(process.env.ALLO_SCORER_ID),
    };

    return score;
  } catch (e) {
    throw new Error("Error fetching score");
  }
}
