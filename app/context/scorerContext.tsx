// --- React Methods
import React, { createContext, useEffect, useMemo, useState } from "react";

// --- Axios
import axios from "axios";

const scorerId = process.env.NEXT_PUBLIC_ALLO_SCORER_ID;
const scorerApiKey = process.env.NEXT_PUBLIC_ALLO_SCORER_API_KEY || "";
const signingMessage = process.env.NEXT_PUBLIC_SCORER_ENDPOINT + "/signing-message";
const scorerApiSubmitPassport = process.env.NEXT_PUBLIC_SCORER_ENDPOINT + "/submit-passport";
const scorerApiGetScore = process.env.NEXT_PUBLIC_SCORER_ENDPOINT + "/score";

export type PassportSubmissionStateType =
  | "APP_INITIAL"
  | "APP_REQUEST_PENDING"
  | "APP_REQUEST_ERROR"
  | "APP_REQUEST_SUCCESS";
export type ScoreStateType = "APP_INITIAL" | "PROCESSING" | "ERROR" | "DONE";

export interface ScorerContextState {
  score: string;
  rawScore: string;
  threshold: string;
  scoreDescription: string;
  passportSubmissionState: PassportSubmissionStateType;
  scoreState: ScoreStateType;

  refreshScore: (address: string | undefined) => Promise<void>;
  submitPassport: (address: string | undefined) => Promise<void>;
}

const startingState: ScorerContextState = {
  score: "",
  rawScore: "",
  threshold: "",
  scoreDescription: "",
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
  refreshScore: async (address: string | undefined): Promise<void> => {},
  submitPassport: async (address: string | undefined): Promise<void> => {},
};

// create our app context
export const ScorerContext = createContext(startingState);

export const ScorerContextProvider = ({ children }: { children: any }) => {
  const [score, setScore] = useState("");
  const [rawScore, setRawScore] = useState("");
  const [threshold, setThreshold] = useState("");
  const [scoreDescription, setScoreDescription] = useState("");
  const [passportSubmissionState, setPassportSubmissionState] = useState<PassportSubmissionStateType>("APP_INITIAL");
  const [scoreState, setScoreState] = useState<ScoreStateType>("APP_INITIAL");

  const loadScore = async (address: string | undefined): Promise<string> => {
    try {
      setScoreState("APP_INITIAL");
      const response = await axios.get(`${scorerApiGetScore}/${scorerId}/${address}`, {
        headers: {
          "X-API-Key": scorerApiKey,
        },
      });
      console.log("Response for score", response.data);
      setScoreState(response.data.status);
      if (response.data.status === "DONE") {
        setScore(response.data.score);
        setRawScore(response.data.evidence.rawScore);
        setThreshold(response.data.evidence.threshold);

        const numRawScore = Number.parseFloat(response.data.evidence.rawScore);
        const numThreshold = Number.parseFloat(response.data.evidence.threshold);

        if (numRawScore > numThreshold) {
          setScoreDescription("Passing Score");
        } else {
          setScoreDescription("Low Score");
        }
      }

      return response.data.status;
    } catch (error) {
      throw error;
    }
  };

  const refreshScore = async (address: string | undefined) => {
    if (address) {
      try {
        let scoreStatus = "PROCESSING";

        while (scoreStatus === "PROCESSING") {
          scoreStatus = await loadScore(address);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const submitPassport = async (address: string | undefined) => {
    if (address) {
      try {
        const response = await axios.post(
          scorerApiSubmitPassport,
          {
            address,
            scorer_id: scorerId,
          },
          {
            headers: {
              "X-API-Key": scorerApiKey,
            },
          }
        );
        console.log("Response for passport submission - scorer: ", response.data);
        refreshScore(address);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // use props as a way to pass configuration values
  const providerProps = {
    score,
    rawScore,
    threshold,
    scoreDescription,
    passportSubmissionState,
    scoreState,
    refreshScore,
    submitPassport,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
