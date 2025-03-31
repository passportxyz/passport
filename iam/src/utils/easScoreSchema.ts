import { SchemaEncoder, ZERO_BYTES32, MultiAttestationRequest } from "@ethereum-attestation-service/eas-sdk";

import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { ethers } from "ethers";

import axios from "axios";
import { handleAxiosError } from "@gitcoin/passport-platforms";
import { serverUtils } from "../utils/identityHelper.js";

const { InternalApiError } = serverUtils;

const SCORER_API_KEY = process.env.SCORER_API_KEY;
const SCORE_DECIMALS = 4;

const parseDecimal = (decimalStr: string): bigint => {
  // Turns e.g. 2.12345 into 2.1234 without using float math
  const truncated = decimalStr.replace(new RegExp(String.raw`(?<=\.\d{${SCORE_DECIMALS}})\d+`), "");
  return ethers.parseUnits(truncated, SCORE_DECIMALS);
};

type ScoreAttestationData = {
  scorer_id: bigint;
  score: bigint;
  score_decimals: bigint;
  threshold: bigint;
  passing_score: boolean;
  stamps: {
    provider: string;
    score: bigint;
  }[];
};

type ParsedScore = {
  expirationTime: bigint;
  attestationData: ScoreAttestationData;
};

type V2ScoreResponseData = {
  address: string;
  score: string; // Ex. "2.34"
  threshold: string;
  passing_score: boolean;
  last_score_timestamp: string;
  expiration_timestamp: string;
  error: string;
  stamps: {
    [provider: string]: {
      score: string;
      dedup: boolean;
      expiration_date?: string;
    };
  };
};

export const ATTESTATION_SCHEMA_ENCODER = new SchemaEncoder(
  "bool passing_score, uint8 score_decimals, uint128 scorer_id, uint32 score, uint32 threshold, tuple(string provider, uint256 score)[] stamps"
);

export const generateScoreAttestationRequest = async ({
  recipient,
  chainIdHex,
  customScorerId,
}: {
  recipient: string;
  chainIdHex: keyof typeof passportOnchainInfo;
  customScorerId?: number;
}): Promise<MultiAttestationRequest[]> => {
  const { attestationData, expirationTime } = await getParsedScore(recipient, customScorerId);

  const encodedData = encodeScoreData(attestationData);

  return [
    {
      schema: passportOnchainInfo[chainIdHex].easSchemas.scoreV2.uid,
      data: [
        {
          recipient,
          expirationTime,
          revocable: true,
          refUID: ZERO_BYTES32,
          value: BigInt(0),
          data: encodedData,
        },
      ],
    },
  ];
};

export async function getParsedScore(address: string, customScorerId?: number): Promise<ParsedScore> {
  const scorer_id = customScorerId || Number(process.env.ALLO_SCORER_ID);

  const score = await requestV2Score(address, scorer_id);

  return parseScore({
    ...score,
    scorer_id,
  });
}

async function requestV2Score(address: string, scorerId: number): Promise<V2ScoreResponseData> {
  const getScoreUrl = `${process.env.SCORER_ENDPOINT}/internal/score/v2/${scorerId}/${address}`;

  try {
    return (
      await axios.get(getScoreUrl, {
        headers: {
          Authorization: SCORER_API_KEY,
        },
      })
    ).data;
  } catch (error) {
    handleAxiosError(error, "Passport V2 score", InternalApiError, [SCORER_API_KEY]);
  }
}

const parseScore = ({
  score,
  threshold,
  passing_score,
  stamps,
  scorer_id,
  /* Can be used if we decide to implement expiration
     time based on score data */
  // expiration_timestamp,
}: V2ScoreResponseData & {
  scorer_id: number;
}): ParsedScore => ({
  expirationTime: BigInt(
    // 90 days from now
    Math.floor(new Date().getTime() / 1000) + 90 * 24 * 60 * 60
  ),
  attestationData: {
    scorer_id: BigInt(scorer_id),
    score: parseDecimal(score),
    score_decimals: BigInt(SCORE_DECIMALS),
    threshold: parseDecimal(threshold),
    passing_score: passing_score,
    stamps: Object.entries(stamps)
      .filter(([_, { dedup, score }]) => parseFloat(score) > 0 && !dedup)
      .map(([provider, { score }]) => ({
        provider,
        score: parseDecimal(score),
      })),
  },
});

export const encodeScoreData = ({
  stamps,
  scorer_id,
  score,
  score_decimals,
  threshold,
  passing_score,
}: ScoreAttestationData): string =>
  ATTESTATION_SCHEMA_ENCODER.encodeData([
    { name: "passing_score", value: passing_score, type: "bool" },
    { name: "score_decimals", value: score_decimals, type: "uint8" },
    { name: "scorer_id", value: scorer_id, type: "uint128" },
    { name: "score", value: score, type: "uint32" },
    { name: "threshold", value: threshold, type: "uint32" },
    {
      name: "stamps",
      value: stamps,
      type: "(string,uint256)[]",
    },
  ]);
