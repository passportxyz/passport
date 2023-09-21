// --- React Methods
import React, { createContext, useState } from "react";

// --- Axios
import axios, { AxiosError } from "axios";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";

const scorerApiGetScore = CERAMIC_CACHE_ENDPOINT + "/score";

export type PassportSubmissionStateType =
  | "APP_INITIAL"
  | "APP_REQUEST_PENDING"
  | "APP_REQUEST_ERROR"
  | "APP_REQUEST_SUCCESS";
export type ScoreStateType = "APP_INITIAL" | "BULK_PROCESSING" | "PROCESSING" | "ERROR" | "DONE";

export interface ScorerContextState {
  score: number;
  rawScore: number;
  threshold: number;
  scoreDescription: string;
  passportSubmissionState: PassportSubmissionStateType;
  scoreState: ScoreStateType;

  refreshScore: (address: string | undefined, dbAccessToken: string) => Promise<void>;
  // submitPassport: (address: string | undefined) => Promise<void>;
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  threshold: 0,
  scoreDescription: "",
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
  refreshScore: async (address: string | undefined, dbAccessToken: string): Promise<void> => {},
  // submitPassport: async (address: string | undefined): Promise<void> => {},
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

  const loadScore = async (address: string | undefined, dbAccessToken: string): Promise<string> => {
    try {
      setScoreState("APP_INITIAL");
      const response = await axios.get(`${scorerApiGetScore}/${address}`, {
        headers: {
          Authorization: `Bearer ${dbAccessToken}`,
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

  const refreshScore = async (
    address: string | undefined,
    dbAccessToken: string
    // submitPassportOnFailure: boolean = true
  ) => {
    if (address) {
      const maxRequests = 30;
      let sleepTime = 1000;
      setPassportSubmissionState("APP_REQUEST_PENDING");
      try {
        let requestCount = 1;
        let scoreStatus = await loadScore(address, dbAccessToken);

        while ((scoreStatus === "PROCESSING" || scoreStatus === "BULK_PROCESSING") && requestCount < maxRequests) {
          requestCount++;
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
          if (sleepTime < 10000) {
            sleepTime += 500;
          }
          scoreStatus = await loadScore(address, dbAccessToken);
        }
        setPassportSubmissionState("APP_REQUEST_SUCCESS");
      } catch (error: AxiosError | any) {
        setPassportSubmissionState("APP_REQUEST_ERROR");
        // Commenting this, as we don't want to submit passport on failure any more - this will be handled in the BE
        // if (submitPassportOnFailure && error.response?.data?.detail === "Unable to get score for provided scorer.") {
        //   submitPassport(address);
        // }
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
    // submitPassport,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
