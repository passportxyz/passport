// --- React Methods
import React, { createContext, useCallback, useEffect, useState } from "react";

// --- Axios
import axios, { AxiosError } from "axios";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { usePlatforms } from "../hooks/usePlatforms";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { useCustomization } from "../hooks/useCustomization";

const scorerApiGetScore = CERAMIC_CACHE_ENDPOINT + "/score";
const scorerApiGetWeights = CERAMIC_CACHE_ENDPOINT + "/weights";

export const parseFloatOneDecimal = (value: string) => parseFloat(parseFloat(value).toFixed(1));

export type PassportSubmissionStateType =
  | "APP_INITIAL"
  | "APP_REQUEST_PENDING"
  | "APP_REQUEST_ERROR"
  | "APP_REQUEST_SUCCESS";
export type ScoreStateType = "APP_INITIAL" | "BULK_PROCESSING" | "PROCESSING" | "ERROR" | "DONE";

export type Weights = {
  [key in PROVIDER_ID]: string;
};

export type StampScores = {
  [key in PROVIDER_ID]: string;
};

export type PlatformScoreSpec = PlatformSpec & {
  possiblePoints: number;
  // Possible points that we want to tell the user
  // about (i.e. excluding deprecated providers)
  displayPossiblePoints: number;
  earnedPoints: number;
};

export interface ScorerContextState {
  score: number;
  rawScore: number;
  threshold: number;
  scoreDescription: string;
  passportSubmissionState: PassportSubmissionStateType;
  scoreState: ScoreStateType;
  scoredPlatforms: PlatformScoreSpec[];
  refreshScore: (address: string | undefined, dbAccessToken: string, forceRescore?: boolean) => Promise<void>;
  fetchStampWeights: () => Promise<void>;
  stampWeights: Partial<Weights>;
  stampScores: Partial<StampScores>;
  // submitPassport: (address: string | undefined) => Promise<void>;
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  threshold: 0,
  scoreDescription: "",
  passportSubmissionState: "APP_INITIAL",
  scoreState: "APP_INITIAL",
  scoredPlatforms: [],
  refreshScore: async (
    address: string | undefined,
    dbAccessToken: string,
    forceRescore: boolean = false
  ): Promise<void> => {},
  fetchStampWeights: async (): Promise<void> => {},
  stampWeights: {},
  stampScores: {},
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
  const [stampScores, setStampScores] = useState<Partial<StampScores>>({});
  const [stampWeights, setStampWeights] = useState<Partial<Weights>>({});
  const [scoredPlatforms, setScoredPlatforms] = useState<PlatformScoreSpec[]>([]);
  const customization = useCustomization();
  const { platformSpecs, platformProviders, platforms, getPlatformSpec } = usePlatforms();

  const loadScore = async (
    address: string | undefined,
    dbAccessToken: string,
    rescore: boolean = false
  ): Promise<string> => {
    try {
      setScoreState("APP_INITIAL");
      let response;
      try {
        const useAlternateScorer = customization.scorer?.id;

        const method = rescore ? "post" : "get";

        const url = `${scorerApiGetScore}/${address}${useAlternateScorer && method === "get" ? `?alternate_scorer_id=${customization.scorer?.id}` : ""}`;
        let data: any;
        if (method === "post") {
          if (useAlternateScorer)
            data = {
              alternate_scorer_id: customization.scorer?.id,
            };
          else data = {};
        } else {
          data = {};
        }

        response = await axios({
          url,
          data,
          method,
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        });
      } catch (e) {
        // Rethrow if this is already rescoring, to avoid loop
        if (rescore) throw e;
        else return loadScore(address, dbAccessToken, true);
      }
      setScoreState(response.data.status);
      if (response.data.status === "DONE") {
        // We need to handle the 2 types the scorers that the backend allows: binary as well as not-binary
        if (response.data.evidence) {
          // This is a binary scorer (binary scorers have the evidence data)
          const numRawScore = parseFloatOneDecimal(response.data.evidence.rawScore);
          const numThreshold = parseFloatOneDecimal(response.data.evidence.threshold);
          const numScore = parseFloatOneDecimal(response.data.score);

          setRawScore(numRawScore);
          setThreshold(numThreshold);
          setScore(numScore);
          setStampScores(response.data.stamp_scores);

          if (numRawScore > numThreshold) {
            setScoreDescription("Passing Score");
          } else {
            setScoreDescription("Low Score");
          }
        } else {
          // This is not a binary scorer
          const numRawScore = parseFloatOneDecimal(response.data.score);
          const numThreshold = 0;
          const numScore = parseFloatOneDecimal(response.data.score);

          setRawScore(numRawScore);
          setThreshold(numThreshold);
          setScore(numScore);
          setStampScores(response.data.stamp_scores);

          setScoreDescription("");
        }
      }

      return response.data.status;
    } catch (error) {
      throw error;
    }
  };

  const fetchStampWeights = async () => {
    try {
      if (customization.scorer?.weights) {
        setStampWeights(customization.scorer?.weights);
      } else {
        // TODO: Fetching the default weights, could become part of the customization step ...
        const response = await axios.get(`${scorerApiGetWeights}`);
        setStampWeights(response.data);
      }
    } catch (error) {
      setPassportSubmissionState("APP_REQUEST_ERROR");
      console.error("Error fetching stamp weights", error);
    }
  };

  const refreshScore = async (
    address: string | undefined,
    dbAccessToken: string,
    forceRescore: boolean = false
    // submitPassportOnFailure: boolean = true
  ) => {
    if (address) {
      const maxRequests = 30;
      let sleepTime = 1000;
      setPassportSubmissionState("APP_REQUEST_PENDING");
      try {
        let requestCount = 1;
        let scoreStatus = await loadScore(address, dbAccessToken, forceRescore);
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

  const calculatePlatformScore = useCallback(() => {
    if (stampScores && stampWeights) {
      const scoredPlatforms = [...platforms.keys()].map((platformId) => {
        const providers = platformProviders[platformId];
        const possiblePoints = providers.reduce(
          (acc, { name }) => acc + (parseFloat(stampWeights[name] || "0") || 0),
          0
        );
        const displayPossiblePoints = providers.reduce(
          (acc, { name, isDeprecated }) => acc + (isDeprecated ? 0 : parseFloat(stampWeights[name] || "0") || 0),
          0
        );
        const earnedPoints = providers.reduce((acc, { name }) => acc + (parseFloat(stampScores[name] || "0") || 0), 0);
        const platformSpec = getPlatformSpec(platformId);
        return {
          ...platformSpec,
          possiblePoints,
          displayPossiblePoints,
          earnedPoints,
        };
      });
      setScoredPlatforms(scoredPlatforms);
    }
  }, [stampScores, stampWeights]);

  useEffect(() => {
    if (!stampScores || !stampWeights) {
      setScoredPlatforms(
        platformSpecs.map((platform) => ({ ...platform, possiblePoints: 0, earnedPoints: 0, displayPossiblePoints: 0 }))
      );
      return;
    }
    calculatePlatformScore();
  }, [stampScores, stampWeights]);

  // use props as a way to pass configuration values
  const providerProps = {
    score,
    rawScore,
    threshold,
    scoreDescription,
    passportSubmissionState,
    scoreState,
    stampWeights,
    stampScores,
    scoredPlatforms,
    refreshScore,
    fetchStampWeights,
    // submitPassport,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
