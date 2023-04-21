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
  score: number;
  rawScore: number;
  passportSubmissionState: PassportSubmissionStateType;
  scoreState: ScoreStateType;

  refreshScore: (address: string) => void;
  submitPassport: (address: string) => void;
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
  refreshScore: (address: string) => {},
  submitPassport: (address: string) => {},
};

// create our app context
export const ScorerContext = createContext(startingState);

export const ScorerContextProvider = ({ children }: { children: any }) => {
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [passportSubmissionState, setPassportSubmissionState] = useState<PassportSubmissionStateType>("APP_INITIAL");
  const [scoreState, setScoreState] = useState<ScoreStateType>("APP_INITIAL");

  const refreshScore = async (address: string) => {
    try {
      const response = await axios.get(`${scorerApiGetScore}/${scorerId}/${address}`, {
        headers: {
          "X-API-Key": scorerApiKey,
        },
      });
      console.log("Response for score", response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const submitPassport = async (address: string) => {
    try {
      const signingMessageResponse = await axios.get(`${signingMessage}`, {
        headers: {
          "X-API-Key": scorerApiKey,
        },
      });

      const signingMessageResponseData = await signingMessageResponse.data;
      const { nonce, message } = signingMessageResponseData;

      const response = await axios.post(scorerApiSubmitPassport, {
        headers: {
          "X-API-Key": scorerApiKey,
        },
        body: {
          address,
          scorer_id: scorerId,
          signature: message,
          nonce,
        },
      });
      console.log("Response for passport submission - scorer: ", response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // use props as a way to pass configuration values
  const providerProps = {
    score,
    rawScore,
    passportSubmissionState,
    scoreState,
    refreshScore,
    submitPassport,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
