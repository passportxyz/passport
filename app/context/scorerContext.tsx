// --- React Methods
import React, { createContext, useCallback, useEffect, useState } from "react";

// --- Axios
import axios from "axios";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { usePlatforms } from "../hooks/usePlatforms";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { useCustomization } from "../hooks/useCustomization";

const scorerApiGetScore = CERAMIC_CACHE_ENDPOINT + "/score";
const scorerApiGetWeights = CERAMIC_CACHE_ENDPOINT + "/weights";

export const parseFloatOneDecimal = (value: string) => parseFloat(parseFloat(value).toFixed(1));

/**
 * Type guard to check if a value is a valid stamp score response object
 */
const isStampObject = (value: any): value is StampScoreResponse =>
  typeof value === "object" && value !== null && "score" in value;

/**
 * Processes stamp scores from API response, handling both V2 and legacy formats.
 * Both are now synchronous, so no polling complexity needed.
 *
 * V2 format: { stamps: { providerId: { score, dedup, expiration_date } } }
 * Legacy format: { stamp_scores: { providerId: "score" } }
 *
 * @param apiResponse - The API response data
 * @returns Object containing extracted scores and deduplication status
 */
const processStampScores = (
  apiResponse: any
): { scores: Partial<StampScores>; dedupStatus: Partial<StampDedupStatus> } => {
  const extractedScores: Partial<StampScores> = {};
  const extractedDedupStatus: Partial<StampDedupStatus> = {};

  // Process V2 format (stamps with objects)
  if (apiResponse.stamps) {
    for (const [providerId, stampData] of Object.entries(apiResponse.stamps)) {
      if (isStampObject(stampData)) {
        extractedScores[providerId as PROVIDER_ID] = stampData.score || "0";
        extractedDedupStatus[providerId as PROVIDER_ID] = stampData.dedup || false;
      }
    }
  }

  // Process legacy format (stamp_scores with strings) - also synchronous now
  if (apiResponse.stamp_scores) {
    for (const [providerId, score] of Object.entries(apiResponse.stamp_scores)) {
      extractedScores[providerId as PROVIDER_ID] = String(score);
      extractedDedupStatus[providerId as PROVIDER_ID] = false;
    }
  }

  return { scores: extractedScores, dedupStatus: extractedDedupStatus };
};

/**
 * Processes score response data from both V2 and legacy API formats.
 * Both formats are now synchronous.
 */
const processScoreResponse = (response: any) => {
  const data = response.data;

  // V2 format detection - has passing_score field (most reliable indicator)
  // Legacy format always has "status" field, V2 format does not
  const isV2 = "passing_score" in data && !("status" in data);

  if (isV2) {
    // V2 format
    const score = parseFloatOneDecimal(data.score || "0");
    const threshold = parseFloatOneDecimal(data.threshold || "0");
    const passingScore = data.passing_score ?? score >= threshold;

    return {
      score,
      rawScore: score,
      threshold,
      passingScore,
      scoreDescription: passingScore ? "Passing Score" : "Low Score",
      error: data.error || null,
    };
  } else {
    // Legacy format - also synchronous now
    const score = parseFloatOneDecimal(data.score || "0");
    const error = data.status === "ERROR" ? "Error" : null;

    if (data.evidence) {
      // Binary scorer
      const rawScore = parseFloatOneDecimal(data.evidence.rawScore || "0");
      const threshold = parseFloatOneDecimal(data.evidence.threshold || "0");
      const passingScore = rawScore >= threshold;

      return {
        score,
        rawScore,
        threshold,
        passingScore,
        error,
        scoreDescription: passingScore ? "Passing Score" : "Low Score",
      };
    } else {
      // Non-binary scorer
      return {
        score,
        rawScore: score,
        threshold: 0,
        passingScore: true,
        scoreDescription: "Passing Score",
        error,
      };
    }
  }
};

export type ScoreState =
  | { status: "initial" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; error: string };

export type Weights = {
  [key in PROVIDER_ID]: string;
};

export type StampScores = {
  [key in PROVIDER_ID]: string;
};

export type StampScoreResponse = {
  score: string;
  dedup: boolean;
  expiration_date?: string;
};

export type StampDedupStatus = {
  [key in PROVIDER_ID]: boolean;
};

// V2 API Response type
export type V2ScoreResponse = {
  address: string;
  score: string | null;
  passing_score: boolean;
  last_score_timestamp: string | null;
  expiration_timestamp: string | null;
  threshold: string;
  error: string | null;
  stamps: Record<string, StampScoreResponse> | null;
};

export type PlatformScoreSpec = PlatformSpec & {
  possiblePoints: number;
  // Possible points that we want to tell the user
  // about (i.e. excluding deprecated providers)
  displayPossiblePoints: number;
  earnedPoints: number;
};

export type POINTED_STAMP_PROVIDER =
  | "SelfStakingBronze"
  | "SelfStakingSilver"
  | "SelfStakingGold"
  | "BeginnerCommunityStaker"
  | "ExperiencedCommunityStaker"
  | "TrustedCitizen"
  | "HolonymGovIdProvider"
  | "HolonymPhone"
  | "CleanHands"
  | "Biometrics";

export type POINTS_FOR_STAMPS_BREAKDOWN_KEY =
  | "ISB"
  | "ISS"
  | "ISG"
  | "CSB"
  | "CSE"
  | "CST"
  | "HGO"
  | "HPH"
  | "HCH"
  | "HBI";
export type POINTS_BREAKDOWN_KEY =
  | POINTS_FOR_STAMPS_BREAKDOWN_KEY
  | "SCB"
  | "HKY"
  | "PMT"
  | "HIM"
  | "MTA"
  | "MM2"
  | "SOG"
  | "TCO"
  | `PMT_${number}`
  | `HIM_${number}`;

const STAMP_PROVIDER_TO_ACTION: [POINTED_STAMP_PROVIDER, POINTS_BREAKDOWN_KEY][] = [
  ["SelfStakingBronze", "ISB"],
  ["SelfStakingSilver", "ISS"],
  ["SelfStakingGold", "ISG"],
  ["BeginnerCommunityStaker", "CSB"],
  ["ExperiencedCommunityStaker", "CSE"],
  ["TrustedCitizen", "CST"],
  ["HolonymGovIdProvider", "HGO"],
  ["HolonymPhone", "HPH"],
  ["CleanHands", "HCH"],
  ["Biometrics", "HBI"],
];
export const providersForPoints = new Set(STAMP_PROVIDER_TO_ACTION.map(([provider, ...rest]) => provider));

export type PointsDataForStamps = Partial<Record<POINTED_STAMP_PROVIDER, number>>;

export type PointsData = {
  total_points: number;
  is_eligible: Boolean;
  multiplier: number;
  breakdown: Partial<Record<POINTS_BREAKDOWN_KEY, number>>;
};

export interface ScorerContextState {
  score: number;
  rawScore: number;
  threshold: number;
  scoreDescription: string;
  scoreState: ScoreState;
  scoredPlatforms: PlatformScoreSpec[];
  refreshScore: (address: string | undefined, dbAccessToken: string, forceRescore?: boolean) => Promise<void>;
  fetchStampWeights: () => Promise<void>;
  stampWeights: Partial<Weights>;
  stampScores: Partial<StampScores>;
  stampDedupStatus: Partial<StampDedupStatus>;
  passingScore: boolean;
  pointsData?: PointsData;
  possiblePointsData?: PointsData;
  pointsDataForStamps: PointsDataForStamps;
  possiblePointsDataForStamps: PointsDataForStamps;
}

const startingState: ScorerContextState = {
  score: 0,
  rawScore: 0,
  threshold: 0,
  scoreDescription: "",
  scoreState: { status: "loading" },
  scoredPlatforms: [],
  refreshScore: async (
    address: string | undefined,
    dbAccessToken: string,
    forceRescore: boolean = false
  ): Promise<void> => {},
  fetchStampWeights: async (): Promise<void> => {},
  stampWeights: {},
  stampScores: {},
  stampDedupStatus: {},
  passingScore: false,
  pointsDataForStamps: {},
  possiblePointsDataForStamps: {},
};

// create our app context
export const ScorerContext = createContext(startingState);

export const ScorerContextProvider = ({ children }: { children: any }) => {
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [scoreDescription, setScoreDescription] = useState("");
  const [scoreState, setScoreState] = useState<ScoreState>({ status: "initial" });
  const [stampScores, setStampScores] = useState<Partial<StampScores>>({});
  const [stampDedupStatus, setStampDedupStatus] = useState<Partial<StampDedupStatus>>({});
  const [stampWeights, setStampWeights] = useState<Partial<Weights>>({});
  const [scoredPlatforms, setScoredPlatforms] = useState<PlatformScoreSpec[]>([]);
  const [pointsData, setPointsData] = useState<PointsData>();
  const [possiblePointsData, setPossiblePointsData] = useState<PointsData>();
  const [pointsDataForStamps, setPointsDataForStamps] = useState<PointsDataForStamps>({});
  const [possiblePointsDataForStamps, setPossiblePointsDataForStamps] = useState<PointsDataForStamps>({});

  const [passingScore, setPassingScore] = useState(false);
  const customization = useCustomization();
  const { platformSpecs, platformProviders, platforms, getPlatformSpec } = usePlatforms();

  const loadScore = async (
    address: string | undefined,
    dbAccessToken: string,
    rescore: boolean = false
  ): Promise<void> => {
    let response;
    setScoreState({ status: "loading" });
    try {
      const useAlternateScorer = customization.scorer?.id;
      const method = rescore ? "post" : "get";
      const url = `${scorerApiGetScore}/${address}${useAlternateScorer && method === "get" ? `?alternate_scorer_id=${customization.scorer?.id}` : ""}`;

      let data: any = {};
      if (method === "post" && useAlternateScorer) {
        data = { alternate_scorer_id: customization.scorer?.id };
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

    // Process response - both V2 and legacy are now synchronous
    const processed = processScoreResponse(response);

    // If API returned an error, throw it before setting any data
    if (processed.error) {
      throw new Error(processed.error);
    }

    const pointsData = response.data.points_data as PointsData;
    const possiblePointsData = response.data.possible_points_data as PointsData;

    setRawScore(processed.rawScore);
    setThreshold(processed.threshold);
    setScore(processed.score);
    setScoreDescription(processed.scoreDescription);
    setPassingScore(processed.passingScore);
    setPointsData(pointsData);
    setPossiblePointsData(possiblePointsData);
    if (pointsData) {
      setPointsDataForStamps(
        STAMP_PROVIDER_TO_ACTION.reduce((acc, [provider, key]) => {
          acc[provider] = pointsData.breakdown[key];
          return acc;
        }, {} as PointsDataForStamps)
      );
    }
    if (possiblePointsData) {
      setPossiblePointsDataForStamps(
        STAMP_PROVIDER_TO_ACTION.reduce((acc, [provider, key]) => {
          acc[provider] = possiblePointsData.breakdown[key];
          return acc;
        }, {} as PointsDataForStamps)
      );
    }
    const { scores, dedupStatus } = processStampScores(response.data);
    setStampScores(scores);
    setStampDedupStatus(dedupStatus);
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
    } catch (error: any) {
      setScoreState({ status: "error", error: error.message || "Failed to fetch stamp weights" });
      console.error("Error fetching stamp weights", error);
    }
  };

  const refreshScore = async (address: string | undefined, dbAccessToken: string, forceRescore: boolean = false) => {
    if (address) {
      setScoreState({ status: "loading" });
      try {
        await loadScore(address, dbAccessToken, forceRescore);
        setScoreState({ status: "success" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load score";
        setScoreState({ status: "error", error: message });
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
  }, [stampScores, stampWeights, platforms, platformProviders, getPlatformSpec]);

  useEffect(() => {
    if (!stampScores || !stampWeights) {
      setScoredPlatforms(
        platformSpecs.map((platform) => ({ ...platform, possiblePoints: 0, earnedPoints: 0, displayPossiblePoints: 0 }))
      );
      return;
    }
    calculatePlatformScore();
  }, [stampScores, stampWeights, calculatePlatformScore]);

  // use props as a way to pass configuration values
  const providerProps = {
    score,
    rawScore,
    threshold,
    scoreDescription,
    scoreState,
    stampWeights,
    stampScores,
    stampDedupStatus,
    scoredPlatforms,
    refreshScore,
    fetchStampWeights,
    passingScore,
    pointsData,
    possiblePointsData,
    pointsDataForStamps,
    possiblePointsDataForStamps,
  };

  return <ScorerContext.Provider value={providerProps}>{children}</ScorerContext.Provider>;
};
