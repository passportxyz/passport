import axios from "axios";
import { handleProviderAxiosError } from "./handleProviderAxiosError";

export const BASE_EAS_SCAN_URL = "https://base.easscan.org/graphql";

export type Attestation = {
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  expirationTime: number;
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

export const verifyAttestation = async (
  address: string,
  attester: string,
  schemaId: string
): Promise<boolean> => {
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
        schema {
          id
        }
      }
    }
  `;

  let result: EASQueryResponse;
  try {
    result = await axios.post(BASE_EAS_SCAN_URL, {
      query,
    });
  } catch (e) {
    handleProviderAxiosError(e, "EAS attestation", []);
  }

  return (
    (result?.data?.data?.attestations || []).filter(
      (attestation) =>
        attestation.revoked === false &&
        attestation.revocationTime === 0 &&
        attestation.expirationTime === 0 &&
        attestation.schema.id === schemaId
    ).length > 0
  );
};
