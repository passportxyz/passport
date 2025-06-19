import { SignatureType } from "@gitcoin/passport-types";

export const IAM_SIGNATURE_TYPE: SignatureType =
  process.env.NEXT_PUBLIC_PASSPORT_IAM_SIGNATURE_TYPE?.toLowerCase() === "eip712" ? "EIP712" : "Ed25519";

// Change of plan. We should not use stamps v2.
// The diferentiation of what exact stamp format is used can be made based on data in the stamp itself.
// There is no need to store additional metadata.
// References to STAMPS_V2 shall be deleted in the future.
// const USE_STAMPS_V2 = IAM_SIGNATURE_TYPE === "EIP712";
const USE_STAMPS_V2 = false;

const CERAMIC_CACHE_ENDPOINT_V1 = process.env.NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT;
const CERAMIC_CACHE_ENDPOINT_V2 = process.env.NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT_V2;
export const CERAMIC_CACHE_ENDPOINT = USE_STAMPS_V2 ? CERAMIC_CACHE_ENDPOINT_V2 : CERAMIC_CACHE_ENDPOINT_V1;

const IAM_ISSUER_DID_V1 = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";

/**
 * This function is supposed to correctly load either one v2 issuer configured as string or an array of issuers configured as a JSON array.
 *
 * @param issuerConfig
 * @returns
 */
function loadV2Issuers(issuerConfig: string): string[] {
  try {
    const issuers = JSON.parse(issuerConfig);
    if (Array.isArray(issuers)) {
      return issuers;
    }
    throw Error("Not a JSON array");
  } catch (error) {
    return [process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID_V2 || ""];
  }
}

const IAM_ISSUER_DID_V2 = loadV2Issuers(process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID_V2 || "");
// We are going tu support multiple valid issuers
export const IAM_VALID_ISSUER_DIDS = new Set([...IAM_ISSUER_DID_V2, IAM_ISSUER_DID_V1]);

export const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "http://localhost:80/api/";
