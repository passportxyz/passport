export type FailResponse = {
  error: boolean;
  errorMessage: string;
};

export type SponsorshipSuccessResponse = {
  hash: string;
};

export type SponsorData = {
  hash: string;
};

export type VerificationSuccessResponse = {
  verification: string;
  unique?: boolean;
  app?: string;
  verificationHash?: string;
  appUserId?: string;
};

export type BrightIdVerificationResponse = FailResponse | VerificationSuccessResponse;

export type BrightIdSponsorshipResponse = FailResponse | SponsorData;

export type SignedVerification = {
  unique: boolean;
  app: string;
  appUserId: string;
  verification: string;
  verificationHash?: string;
  timestamp?: number;
  sig?: string;
  publicKey?: string;
};

export type BrightIdProcedureResponse = {
  valid: boolean;
  result?: BrightIdSponsorshipResponse | SignedVerification;
  error?: string;
};
