import axios from "axios";
import { easEncodeScore, Score } from "./easSchema";

const scorerApiGetScore = process.env.SCORER_ENDPOINT + "/score";

export async function fetchEncodedPassportScore(address: string, dbAccessToken: string): Promise<string> {
  try {
    const response: {
      data: {
        status: string;
        score: number | string;
      };
    } = await axios.get(`${scorerApiGetScore}/${address}`, {
      headers: {
        Authorization: `Bearer ${dbAccessToken}`,
      },
    });

    const { data } = response;

    if (data.status !== "DONE") {
      throw new Error(`Score not ready yet. Status: ${data.status}`);
    }

    const score: Score = {
      // TODO: a bit hacky
      score: data.score === "0E-9" ? 0 : Number(data.score),
      scorer_id: Number(process.env.ALLO_SCORER_ID),
    };

    return easEncodeScore(score);
  } catch (error) {
    console.log({ error });
    throw new Error("Error fetching score");
  }
}
