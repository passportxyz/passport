// --- React Methods
import React, { createContext, useEffect, useMemo, useState } from "react";

// --- Axios
import axios, { AxiosError } from "axios";

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
  score: number;
  rawScore: number;
  threshold: number;
  scoreDescription: string;
  passportSubmissionState: PassportSubmissionStateType;
  scoreState: ScoreStateType;

  refreshScore: (address: string | undefined) => Promise<void>;
  submitPassport: (address: string | undefined) => Promise<void>;
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  threshold: 0,
  scoreDescription: "",
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
  refreshScore: async (address: string | undefined): Promise<void> => {},
  submitPassport: async (address: string | undefined): Promise<void> => {},
};

// create our app context
export const ScorerContext = createContext(startingState);

export const ScorerContextProvider = ({ children }: { children: any }) => {
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [threshold, setThreshold] = useState(0);
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
      setScoreState(response.data.status);
      if (response.data.status === "DONE") {
        setScore(response.data.score);

        const numRawScore = Number.parseFloat(response.data.evidence.rawScore);
        const numThreshold = Number.parseFloat(response.data.evidence.threshold);
        const numScore = Number.parseFloat(response.data.score);

        setRawScore(numRawScore);
        setThreshold(numThreshold);
        setScore(numScore);

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

  const refreshScore = async (address: string | undefined, submitePassportOnFailure: boolean = true) => {
    if (address) {
      setPassportSubmissionState("APP_REQUEST_PENDING");
      try {
        let scoreStatus = "PROCESSING";

        while (scoreStatus === "PROCESSING") {
          scoreStatus = await loadScore(address);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
        setPassportSubmissionState("APP_REQUEST_SUCCESS");
      } catch (error: AxiosError | any) {
        setPassportSubmissionState("APP_REQUEST_ERROR");
        if (submitePassportOnFailure && error.response.data.detail === "Unable to get score for provided scorer.") {
          submitPassport(address);
        }
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
        // Refresh score, but set the submitePassportOnFailure to false -> we want to avoid a loop
        refreshScore(address, false);
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
