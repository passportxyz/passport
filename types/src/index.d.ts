// BrightId Shared Types
export { BrightIdProcedureResponse, BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "./brightid";

// Typing for required parts of DIDKit
export type DIDKitLib = {
  verifyCredential: (vc: string, proofOptions: string) => Promise<string>;
  issueCredential: (credential: string, proofOptions: string, key: string) => Promise<string>;
  keyToDID: (method_pattern: string, jwk: string) => string;
  keyToVerificationMethod: (method_pattern: string, jwk: string) => Promise<string>;
} & { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

// rough outline of a VerifiableCredential
export type VerifiableCredential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string }[];
    hash?: string;
    provider?: string;
    address?: string;
    challenge?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof: {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    created: string;
    jws: string;
  };
};

// values received from client and fed into the verify route
export type RequestPayload = {
  type: string;
  address: string;
  version: string;
  proofs?: {
    [k: string]: string;
  };
  challenge?: string;
};

// response Object return by verify procedure
export type ChallengePayload = {
  valid: boolean;
  error?: string[];
  // This will overwrite the record presented in the Payload
  record?: {
    challenge: string;
  } & { [k: string]: string };
};

// response Object return by verify procedure
export type VerifiedPayload = {
  valid: boolean;
  error?: string[];
  // This will be combined with the ProofRecord (built from the verified content in the Payload)
  record?: { [k: string]: string };
};

// these values are placed into a sha256 along with the IAM_PRIVATE_KEY to generate a deterministic but protected hash of the PII info
export type ProofRecord = {
  type: string;
  version: string;
  username?: string;
  email?: string;
  proofMsg?: string;
} & { [k: string]: string };

// IAM HTTP Request body types
export type ChallengeRequestBody = {
  payload: RequestPayload;
};
export type VerifyRequestBody = {
  challenge: VerifiableCredential;
  payload: RequestPayload;
};

// IAM HTTP Response body types
export type ValidResponseBody = {
  credential: VerifiableCredential;
  record?: ProofRecord;
};
export type ErrorResponseBody = {
  error: string;
};
export type CredentialResponseBody = ValidResponseBody & ErrorResponseBody;

// Issued Credential response
export type IssuedChallenge = {
  challenge: VerifiableCredential;
};
export type IssuedCredential = {
  credential: VerifiableCredential;
};

// Issued Credential and support matterial returned when fetching the VerifiableCredential
export type VerifiableCredentialRecord = {
  signature: string;
  record: ProofRecord;
  challenge: VerifiableCredential;
  credential: VerifiableCredential;
};

export type Stamp = {
  // recordUserName: string;
  // credentialIssuer: string;
  provider: PROVIDER_ID;
  credential: VerifiableCredential;
};

export type Passport = {
  issuanceDate: Date;
  expiryDate: Date;
  stamps: Stamp[];
};

// Passport DID
export type DID = string;

export type PROVIDER_ID = "Google" | "Ens" | "Poh" | "Twitter" | "POAP" | "Facebook" | "Brightid" | "Github";
