import "dotenv/config";
import { loadEnv } from "./utils";
import axios from "axios";

const { env } = loadEnv(["PASSPORT_SCORER_API_KEY", "PASSPORT_SCORER_ID"]);

const SCORER_URL = "https://api.scorer.gitcoin.co";

export const runFunction = async (name: string, args: any) => {
  return JSON.stringify(await getFunctionResponse(name, args));
};

const getFunctionResponse = async (name: string, args: string) => {
  const parsedArgs = JSON.parse(args);
  switch (name) {
    case "get_score":
      return await getScore(parsedArgs.address);
    case "get_stamps":
      return await getStamps(parsedArgs.address);
    case "flag_user":
      return await flagUser(parsedArgs.address);
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

type GetStampsResponse = {
  data: {
    stamps: {
      stamp: any;
    }[];
  };
};

const getStamps = async (address: string) => {
  try {
    const { data }: GetStampsResponse = await axios.get(`${SCORER_URL}/ceramic-cache/stamp?address=${address}`);

    const stamps = data.stamps.map(({ stamp }: any) => stamp);

    return { success: true, stamps };
  } catch (e) {
    console.error("Error getting stamps:", e);
    return { success: false };
  }
};

const getScore = async (address: string) => {
  try {
    const { data }: GetScoreResponse = await axios.post(
      `${SCORER_URL}/registry/submit-passport`,
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
  } catch (e) {
    console.error("Error submitting passport:", e);
    return { success: false };
  }
};

const flagUser = async (address: string) => {
  console.log("flagging user", address);
};
