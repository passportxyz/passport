import { utils } from "ethers";
import {
  NO_EXPIRATION,
  SchemaEncoder,
  ZERO_BYTES32,
  MultiAttestationRequest,
  AttestationRequestData,
} from "@ethereum-attestation-service/eas-sdk";
import onchainInfo from "../../../deployments/onchainInfo.json";
import { VerifiableCredential } from "@gitcoin/passport-types";

import { fetchPassportScore } from "./scorerService";

const attestationSchemaEncoder = new SchemaEncoder("bytes32 provider, bytes32 hash");

export const encodeEasStamp = (credential: VerifiableCredential): string => {
  // We hash the provider to get a bytes32 value
  const providerValue = utils.keccak256(utils.toUtf8Bytes(credential.credentialSubject.provider));

  // We decode the hash to get back the original bytes32 value
  // The format of the hash is: v0.0.0:BASE64_ENCODED_BYTES32
  const hashValue = "0x" + Buffer.from(credential.credentialSubject.hash.split(":")[1], "base64").toString("hex");

  const encodedData = attestationSchemaEncoder.encodeData([
    { name: "provider", value: providerValue, type: "bytes32" },
    { name: "hash", value: hashValue, type: "bytes32" },
  ]);
  return encodedData;
};

export type Score = {
  score: number;
  scorer_id: number;
};

export const encodeEasScore = (score: Score): string => {
  const decimals = 18;

  const bnScore = utils.parseUnits(score.score.toString(), decimals);

  const schemaEncoder = new SchemaEncoder("uint256 score,uint32 scorer_id,uint8 score_decimals");
  const encodedData = schemaEncoder.encodeData([
    { name: "score", value: bnScore, type: "uint256" },
    { name: "scorer_id", value: score.scorer_id, type: "uint32" },
    { name: "score_decimals", value: decimals, type: "uint8" },
  ]);

  return encodedData;
};

type ValidatedCredential = {
  credential: VerifiableCredential;
  verified: boolean;
};

export const formatMultiAttestationRequest = async (
  credentials: ValidatedCredential[],
  recipient: string,
  chainIdHex: keyof typeof onchainInfo
): Promise<MultiAttestationRequest[]> => {
  const defaultRequestData = {
    recipient,
    expirationTime: NO_EXPIRATION,
    revocable: true,
    refUID: ZERO_BYTES32,
    value: 0,
  };

  const stampRequestData: AttestationRequestData[] = credentials
    .filter(({ verified }) => verified)
    .map(({ credential }) => {
      return {
        ...defaultRequestData,
        data: encodeEasStamp(credential),
      };
    });

  const scoreRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasScore(await fetchPassportScore(recipient)),
    },
  ];

  const { easSchemas } = onchainInfo[chainIdHex];

  return [
    {
      schema: process.env.EAS_GITCOIN_STAMP_SCHEMA,
      data: stampRequestData,
    },
    {
      schema: easSchemas.score.uid,
      data: scoreRequestData,
    },
  ];
};
