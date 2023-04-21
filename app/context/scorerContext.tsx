// --- React Methods
import React, { createContext, useEffect, useMemo, useState } from "react";

// --- Wallet connection utilities
import { useConnectWallet } from "@web3-onboard/react";
import { initWeb3Onboard } from "../utils/onboard";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { OnboardAPI } from "@web3-onboard/core";

// -- Ceramic and Glazed
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerConnection } from "@self.id/framework";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

import { DIDSession } from "did-session";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { AccountId } from "caip";
import { DID } from "dids";
import { Cacao } from "@didtools/cacao";
import axios from "axios";

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
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
};

// create our app context
export const ScorerContext = createContext(startingState);

export const ScorerContexttProvider = ({ children }: { children: any }) => {
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [passportSubmissionState, setPassportSubmissionState] = useState<PassportSubmissionStateType>("APP_INITIAL");
  const [scoreState, setScoreState] = useState<ScoreStateType>("APP_INITIAL");

  // use props as a way to pass configuration values
  const providerProps = {
    score,
    rawScore,
    passportSubmissionState,
    scoreState,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
