import {
  SchemaEncoder,
  ZERO_BYTES32,
  MultiAttestationRequest,
} from "@ethereum-attestation-service/eas-sdk";

import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { ethers } from "ethers";

import { IAMError } from "@gitcoin/passport-identity";
import axios from "axios";
import { handleAxiosError } from "@gitcoin/passport-platforms";

const SCORER_API_KEY = process.env.SCORER_API_KEY;
const SCORE_DECIMALS = 4;

const parseDecimal = (decimalStr: string): bigint =>
  ethers.parseUnits(decimalStr, SCORE_DECIMALS);

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

const ATTESTATION_SCHEMA_ENCODER = new SchemaEncoder(
  "bool passing_score, uint8 score_decimals, uint128 scorer_id, uint32 score, uint32 threshold, uint48 reserved, tuple(string provider, uint32 score)[] stamps",
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
  const { attestationData, expirationTime } = await getParsedScore(
    recipient,
    customScorerId,
  );

  const encodedData = encodeScoreData(attestationData);

  return [
    {
      // TODO
      // schema: passportOnchainInfo[chainIdHex].easSchemas.scoreV2.uid,
      schema: passportOnchainInfo[chainIdHex].easSchemas.score.uid,
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

export async function getParsedScore(
  address: string,
  customScorerId?: number,
): Promise<ParsedScore> {
  const scorer_id = customScorerId || Number(process.env.ALLO_SCORER_ID);

  const score = await requestV2Score(address, scorer_id);

  return parseScore({
    ...score,
    scorer_id,
  });
}

async function requestV2Score(
  address: string,
  scorerId: number,
): Promise<V2ScoreResponseData> {
  // TODO this endpoint doesn't exist yet
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
    handleAxiosError(error, "Passport V2 score", IAMError, [SCORER_API_KEY]);
  }
}

const parseScore = ({
  score,
  threshold,
  expiration_timestamp,
  passing_score,
  stamps,
  scorer_id,
}: V2ScoreResponseData & {
  scorer_id: number;
}): ParsedScore => ({
  expirationTime: BigInt(
    // TODO Do we want to do this, or just today + 90 days?
    // Or leave blank and use creation + 90 days?
    Math.floor(new Date(expiration_timestamp).getTime() / 1000),
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

const encodeScoreData = ({
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
    // Gap to fill out 256 bit word, could potentially be used for metadata
    { name: "reserved", value: BigInt(0), type: "uint48" },
    {
      name: "stamps",
      value: stamps,
      type: "(string,uint32)[]",
    },
  ]);
