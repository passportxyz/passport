import "dotenv/config";
import { loadEnv } from "./utils";
import axios from "axios";

const { env } = loadEnv(["PASSPORT_SCORER_API_KEY", "PASSPORT_SCORER_ID"]);

export const runFunction = async (name: string, args: any) => {
  return JSON.stringify(await getFunctionResponse(name, args));
};

const getFunctionResponse = async (name: string, args: string) => {
  const parsedArgs = JSON.parse(args);
  switch (name) {
    case "get_score":
      return await getScore(parsedArgs.address);
    default:
      return "null";
  }
};

type GetScoreResponse = {
  data: {
    score: string;
    status: string;
    evidence: {
      rawScore: string;
    };
  };
};

const getScore = async (address: string) => {
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
