// Typing for required parts of DIDKit
export type DIDKitLib = {
  verifyCredential: (vc: string, proofOptions: string) => Promise<any>;
  issueCredential: (credential: string, proofOptions: string, key: string) => Promise<any>;
} & { [key: string]: any };

// rough outline of a VerifiableCredential
export type VerifiableCredential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string }[];
  } & { [key: string]: string };
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
export type Payload = {
  type: string;
  address: string;
  version: string;
  proofs?: {
    [k: string]: string;
  };
};

// this type controls the challenge verifiable credential - issued to verify the bearer owns the address for the verify stage
export type ChallengeRecord = {
  type: string;
  address: string;
  version: string;
  challenge?: string;
};
// response Object return by verify procedure
export type Challenge = {
  valid: boolean;
  error?: string[];
  // This will overwrite the record presented in the Payload
  record?: {
    challenge: string;
  } & { [k: string]: string };
};

// these values are placed into a merkle-tree according to the response of a Provider
export type VerificationRecord = {
  type: string;
  address: string;
  version: string;
  username?: string;
  email?: string;
  proofMsg?: string;
} & { [k: string]: string };

// response Object return by verify procedure
export type Verification = {
  valid: boolean;
  error?: string[];
  // This will be combined with the VerificationRecord (built from the verified content in the Payload)
  record?: { [k: string]: string };
};

// IAM HTTP Request body types
export type ChallengeRequestBody = {
  payload: Payload;
};
export type VerifyRequestBody = {
  challenge: VerifiableCredential;
  payload: Payload;
};

// IAM HTTP Response body types
export type ValidResponseBody = {
  credential: VerifiableCredential;
  record?: VerificationRecord;
};
export type ErrorResponseBody = {
  error: string;
};
export type CredentialResponseBody = ValidResponseBody & ErrorResponseBody;
