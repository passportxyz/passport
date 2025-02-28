import {
  NO_EXPIRATION,
  SchemaEncoder,
  ZERO_BYTES32,
  MultiAttestationRequest,
  AttestationRequestData,
} from "@ethereum-attestation-service/eas-sdk";
import { VerifiableCredential } from "@gitcoin/passport-types";

import { fetchPassportScore } from "./scorerService.js";
import { encodeEasScore } from "./easStampSchema.js";
import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { ethers } from "ethers";

import bitMapData from "../static/providerBitMapInfo.json" with { type: "json" };
import { IAMError } from "@gitcoin/passport-identity";
import axios from "axios";
import { handleAxiosError } from "@gitcoin/passport-platforms";

export const bitMapDataTest = bitMapData;

type ScoreAttestationData = {
  scorer_id: bigint;
  score: bigint;
  score_decimals: bigint;
  threshold: bigint;
  passing_score: boolean;
  // TODO Probably just put on the attestation itself instead?
  expiration_timestamp: bigint;
  // Only writing stamps that aren't deduplicated, so no need to include nullifiers or dedup info
  // TODO Call this providers?
  providers: string[];
};

type V2ScoreResponse = {
  address: string;
  // Formatted as "2.34", need to go to e.g. "2340000000000000000"
  score: string;
  threshold: string;
  passing_score: boolean;
  last_score_timestamp: number;
  expiration_timestamp: number;
  error: string;
  stamps: {
    [provider: string]: {
      score: string;
      dedup: boolean;
      nullifiers: string[];
      expiration_date?: string;
    };
  };
};

const ATTESTATION_SCHEMA_ENCODER = new SchemaEncoder(
  // TODO do we want to bother with packing these? They're tiny compared to the strings.
  // TODO If we are packing, should we pack the score and threshold too? Like maybe use 4 decimals instead of
  // 18? and put them in uint32s? If we did that and shrunk scorer_id to uint112, we could fit everything besides
  // the providers in a single word
  "bool passing_score, uint8 score_decimals, uint64 expiration_timestamp, uint128 scorer_id, uint256 score, uint256 threshold, string[] providers",
);

export const encodeScoreAttestation = ({
  providers,
  scorer_id,
  score,
  score_decimals,
  threshold,
  passing_score,
  expiration_timestamp,
}: ScoreAttestationData): string =>
  ATTESTATION_SCHEMA_ENCODER.encodeData([
    { name: "passing_score", value: passing_score, type: "bool" },
    { name: "score_decimals", value: score_decimals, type: "uint8" },
    {
      name: "expiration_timestamp",
      value: expiration_timestamp,
      type: "uint64",
    },
    { name: "scorer_id", value: scorer_id, type: "uint128" },
    { name: "score", value: score, type: "uint256" },
    { name: "threshold", value: threshold, type: "uint256" },
    { name: "providers", value: providers, type: "string[]" },
  ]);

type ValidatedCredential = {
  credential: VerifiableCredential;
  verified: boolean;
};

export const formatMultiAttestationRequestWithPassportAndScore = async (
  credentials: ValidatedCredential[],
  recipient: string,
  chainIdHex: keyof typeof passportOnchainInfo,
  customScorerId?: number,
): Promise<MultiAttestationRequest[]> => {
  const defaultRequestData = {
    recipient,
    expirationTime: NO_EXPIRATION,
    revocable: true,
    refUID: ZERO_BYTES32,
    value: BigInt(0),
  };

  const stampRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasPassport(
        credentials
          .filter(({ verified }) => verified)
          .map(({ credential }) => {
            return credential;
          }),
      ),
    },
  ];

  const scoreRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasScore(await fetchPassportScore(recipient, customScorerId)),
    },
  ];

  const { easSchemas } = passportOnchainInfo[chainIdHex];

  return [
    {
      schema: easSchemas.passport.uid,
      data: stampRequestData,
    },
    {
      schema: easSchemas.score.uid,
      data: scoreRequestData,
    },
  ];
};

export const formatScoreAttestation = async (
  recipient: string,
  chainIdHex: keyof typeof passportOnchainInfo,
  customScorerId?: number,
): Promise<MultiAttestationRequest[]> => {
  const defaultRequestData = {
    recipient,
    // TODO or should we expire?
    expirationTime: NO_EXPIRATION,
    revocable: true,
    refUID: ZERO_BYTES32,
    value: BigInt(0),
  };

  const scoreAttestationData = await fetchScore(recipient, customScorerId);

  const encodedAttestationData = encodeScoreAttestation(scoreAttestationData);

  const scoreRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodedAttestationData,
    },
  ];

  const { easSchemas } = passportOnchainInfo[chainIdHex];

  return [
    {
      schema: easSchemas.score.uid,
      data: scoreRequestData,
    },
  ];
};
const SCORER_API_KEY = process.env.SCORER_API_KEY;

const SCORE_DECIMALS = 18;

export async function fetchScore(
  address: string,
  customScorerId?: number,
): Promise<ScoreAttestationData> {
  const scorer_id = customScorerId || Number(process.env.ALLO_SCORER_ID);

  const response = await requestV2Score(address, scorer_id);

  const score = ethers.parseUnits(response.score, SCORE_DECIMALS);
  const threshold = ethers.parseUnits(response.threshold, SCORE_DECIMALS);
  const expiration_timestamp = BigInt(
    new Date(response.expiration_timestamp).getTime() / 1000,
  );
  const providers = Object.entries(response.stamps)
    .filter(([_, { dedup, score }]) => parseFloat(score) > 0 && !dedup)
    .map(([provider, _]) => provider)
    .sort();

  return {
    score,
    threshold,
    providers,
    expiration_timestamp,
    scorer_id: BigInt(scorer_id),
    passing_score: response.passing_score,
    score_decimals: BigInt(SCORE_DECIMALS),
  };
}

async function requestV2Score(
  address: string,
  scorerId: number,
): Promise<V2ScoreResponse> {
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
