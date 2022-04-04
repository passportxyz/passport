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

// these values are placed into a merkle-tree according to the response of a Provider
export type MerkleRecord = {
  type: string;
  address: string;
  version: string;
  username?: string;
  email?: string;
  proofMsg?: string;
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

// response Object return by verify procedure
export type Verification = {
  valid: boolean;
  error?: string[];
  // This will overwrite the record presented in the Payload
  record?: { [k: string]: string };
};
