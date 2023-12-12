import "dotenv/config";
import { loadEnv } from "./setup";
import axios from "axios";

const { env } = loadEnv(["PASSPORT_SCORER_API_KEY", "PASSPORT_SCORER_ID"]);

type GetScoreResponse = {
  data: {
    score: string;
    status: string;
    evidence: {
      rawScore: string;
    };
  };
};

export const get_score = async (address: string) => {
  const { data }: GetScoreResponse = await axios.post(
    "https://api.scorer.gitcoin.co/registry/submit-passport",
    {
      address,
      scorer_id: env.PASSPORT_SCORER_ID,
    },
    {
      headers: {
        "X-API-Key": env.PASSPORT_SCORER_API_KEY,
      },
    }
  );

  if (data.status !== "DONE") {
    return { success: false };
  }

  const scoreIsPassing = Number(data.score) == 1;

  return { success: true, scoreIsPassing, rawScore: data.evidence.rawScore };
};
