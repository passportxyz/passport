import {
  NO_EXPIRATION,
  SchemaEncoder,
  ZERO_BYTES32,
  MultiAttestationRequest,
  AttestationRequestData,
} from "@ethereum-attestation-service/eas-sdk";
import { VerifiableCredential, StampBit } from "@gitcoin/passport-types";

import { fetchPassportScore } from "./scorerService.js";
import { encodeEasScore } from "./easStampSchema.js";
import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };

import bitMapData from "../static/providerBitMapInfo.json" with { type: "json" };

export const bitMapDataTest = bitMapData;
export type AttestationStampInfo = {
  hash: string;
  stampInfo: PassportAttestationStamp;
  issuanceDate: bigint;
  expirationDate: bigint;
};

export type PassportAttestationData = {
  providers: bigint[];
  info: AttestationStampInfo[];
};

export type PassportAttestationStamp = {
  name: string;
  index: number;
  bit: number;
};

export type StampMetadata = {
  id: string;
  name: string;
  groups: {
    name: string;
    stamps: {
      name: string;
    }[];
  }[];
}[];

// exported to buildProviderBitMap for formatting
export const mapBitMapInfo = (metaData: StampMetadata): PassportAttestationStamp[] => {
  let bit = 0;
  let index = 0;

  return metaData.flatMap((entry) =>
    entry.groups.flatMap((group) =>
      group.stamps.map((stamp) => {
        const result = { bit: bit % 256, index, name: stamp.name };
        bit++;
        if (bit % 256 === 0) index++;
        return result;
      })
    )
  );
};

export const buildProviderBitMap = (): Map<string, PassportAttestationStamp> => {
  const bitMapInfo = bitMapData as unknown as StampBit[];
  const passportAttestationStampMap: Map<string, PassportAttestationStamp> = new Map();

  bitMapInfo.forEach((stamp) => passportAttestationStampMap.set(stamp.name, stamp));

  return passportAttestationStampMap;
};

export const formatPassportAttestationData = (credentials: VerifiableCredential[]): PassportAttestationData => {
  const passportAttestationStampMap = buildProviderBitMap();
  return credentials.reduce(
    (acc: PassportAttestationData, credential: VerifiableCredential) => {
      const stampInfo: PassportAttestationStamp = passportAttestationStampMap.get(
        credential.credentialSubject.provider
      );

      if (stampInfo) {
        const index = stampInfo.index;
        if (acc.providers.length <= index) {
          // We must add another element to the array of providers
          acc.providers.length = index + 1;
          acc.providers[index] = BigInt(0);
        }
        // Shift the bit `1` to the left by the number of bits specified in the stamp info
        acc.providers[index] = acc.providers[index] | (BigInt(1) << BigInt(stampInfo.bit));

        // We decode the original 256-bit hash value from the credential
        const hashValue = "0x" + Buffer.from(credential.credentialSubject.hash.split(":")[1], "base64").toString("hex");
        // Get the unix timestamp, the number of milliseconds since January 1, 1970, UTC
        const issuanceDate = Math.floor(new Date(credential.issuanceDate).getTime() / 1000);
        const expirationDate = Math.floor(new Date(credential.expirationDate).getTime() / 1000);
        acc.info.push({
          hash: hashValue,
          issuanceDate: BigInt(issuanceDate),
          expirationDate: BigInt(expirationDate),
          stampInfo: stampInfo,
        });
      } else {
        throw new Error(`Provider ${credential.credentialSubject.provider} not supported. Please contact support.`);
      }
      return acc;
    },
    {
      providers: [],
      info: [],
    }
  );
};

export type AttestationData = {
  hashes: string[];
  issuancesDates: bigint[];
  expirationDates: bigint[];
};

export const sortPassportAttestationData = (attestation: PassportAttestationData): AttestationData => {
  attestation.info = attestation.info.sort((a, b) => {
    // We want to order first by index position and then by bit order
    const indexCompare = a.stampInfo.index - b.stampInfo.index;
    if (indexCompare === 0) {
      return a.stampInfo.bit - b.stampInfo.bit;
    }
    return indexCompare;
  });

  const hashes = attestation.info.map((info) => info.hash);
  const issuancesDates = attestation.info.map((info) => info.issuanceDate);
  const expirationDates = attestation.info.map((info) => info.expirationDate);

  return {
    hashes,
    issuancesDates,
    expirationDates,
  };
};

export const encodeEasPassport = (credentials: VerifiableCredential[]): string => {
  const attestation = formatPassportAttestationData(credentials);

  const attestationSchemaEncoder = new SchemaEncoder(
    "uint256[] providers, bytes32[] hashes, uint64[] issuanceDates, uint64[] expirationDates, uint16 providerMapVersion"
  );

  const { hashes, issuancesDates, expirationDates } = sortPassportAttestationData(attestation);

  const encodedData = attestationSchemaEncoder.encodeData([
    { name: "providers", value: attestation.providers, type: "uint256[]" },
    { name: "hashes", value: hashes, type: "bytes32[]" },
    { name: "issuanceDates", value: issuancesDates, type: "uint64[]" },
    { name: "expirationDates", value: expirationDates, type: "uint64[]" },
    // This will be used later for decoding provider mapping for scoring and within the resolver contract
    // Currently set to zero but should be updated whenever providerBitMapInfo.json is updated
    { name: "providerMapVersion", value: BigInt(0), type: "uint16" },
  ]);

  return encodedData;
};

type ValidatedCredential = {
  credential: VerifiableCredential;
  verified: boolean;
};

export const formatMultiAttestationRequestWithPassportAndScore = async (
  credentials: ValidatedCredential[],
  recipient: string,
  chainIdHex: keyof typeof passportOnchainInfo,
  customScorerId?: number
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
          })
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

export const formatMultiAttestationRequestWithScore = async (
  recipient: string,
  chainIdHex: keyof typeof passportOnchainInfo,
  customScorerId?: number
): Promise<MultiAttestationRequest[]> => {
  const defaultRequestData = {
    recipient,
    expirationTime: NO_EXPIRATION,
    revocable: true,
    refUID: ZERO_BYTES32,
    value: BigInt(0),
  };

  const scoreRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasScore(await fetchPassportScore(recipient, customScorerId)),
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
