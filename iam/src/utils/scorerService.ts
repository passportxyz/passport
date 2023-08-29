import axios from "axios";
import { Score } from "./easStampSchema";
import { AxiosError } from "axios";

const scorerApiGetScore = `${process.env.SCORER_ENDPOINT}/registry/score/${process.env.ALLO_SCORER_ID}`;

export class IAMError extends Error {
  details: string[] = [];
  _isIAMError = true;

  constructor(public message: string, details?: string[]) {
    super(message);
    if (details) {
      this.details = details;
    }
  }

  toJson(): Record<string, unknown> {
    return {
      error: this.message,
      details: this.details,
    };
  }

  static isIAMError(error: unknown): boolean {
    return (error as IAMError)._isIAMError;
  }
}

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
        "X-API-Key": "dwefwef",
      },
    });

    const { data } = response;

    if (data.status !== "DONE") {
      throw new IAMError(`Score not ready yet. Status: ${data.status}`);
    }

    const score: Score = {
      score: Number(data.evidence.rawScore),
      scorer_id: Number(process.env.ALLO_SCORER_ID),
    };

    return score;
  } catch (error) {
    if (IAMError.isIAMError(error)) {
      throw error;
    } else if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error as unknown as AxiosError;
      if (axiosError.response) {
        // The request was made, but the server responded with an error status
        throw new IAMError("Error fetching score.", [
          axiosError.message,
          axiosError.response.statusText,
          JSON.stringify(axiosError.response.data),
        ]);
      } else {
        throw new IAMError("Error fetching score, no response received.", [axiosError.message]);
      }
    } else {
      throw new IAMError("Unknown error while fetching score.", [(error as Error).message]);
    }
  }
}
