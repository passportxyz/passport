import axios from "axios";
import { handleProviderAxiosError } from "./handleProviderAxiosError";

export type Attestation = {
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  expirationTime: number;
  decodedDataJson: string;
  schema: {
    id: string;
  };
};

export type EASQueryResponse = {
  data?: {
    data?: {
      attestations: Attestation[];
    };
  };
};

type ScoreAttestation = {
  name: string;
  type: string;
  signature: string;
  value: {
    name: string;
    type: string;
    value: {
      type: string;
      hex: string;
    };
  };
};

export function parseScoreFromAttestation(
  attestations: Attestation[],
  schemaId: string
): number | null {
  const validAttestation = attestations.find(
    (attestation) =>
      attestation.revoked === false &&
      attestation.revocationTime === 0 &&
      attestation.expirationTime === 0 &&
      attestation.schema.id === schemaId
  );

  if (!validAttestation) {
    return  null;
  }

  try {
    const decodedData = JSON.parse(validAttestation.decodedDataJson) as ScoreAttestation[];
    const scoreData = decodedData.find((item) => item.name === "score");
    const scoreDecimalsData = decodedData.find((item) => item.name === "score_decimals");

    if (scoreData?.value?.value?.hex && scoreDecimalsData?.value?.value) {
      const score = Number(BigInt(scoreData.value.value.hex));
      const decimals = Number(scoreDecimalsData.value.value);
      return Number(score) / 10 ** decimals;
    }
  } catch (error) {
    console.error("Error parsing score from attestation:", error);
  }

  return null;
}


export const verifyCoinbaseAttestation = (attestations: Attestation[], schemaId: string): boolean => {
  return attestations.filter(
        (attestation) =>
          attestation.revoked === false &&
          attestation.revocationTime === 0 &&
          attestation.expirationTime === 0 &&
          attestation.schema.id === schemaId
      ).length > 0;
};

export const getAttestations = async (
  address: string,
  attester: string,
  easScanUrl: string
): Promise<Attestation[] | null> => {
  const query = `
    query {
      attestations (where: {
          attester: { equals: "${attester}" },
          recipient: { equals: "${address}", mode: insensitive }
      }) {
        recipient
        revocationTime
        revoked
        expirationTime
        decodedDataJson
        schema {
          id
        }
      }
    }
  `;

  let result: EASQueryResponse;
  try {
    result = await axios.post(easScanUrl, {
      query,
    });
  } catch (e) {
    handleProviderAxiosError(e, "EAS attestation", []);
  }

  return result?.data?.data?.attestations || [];
};
