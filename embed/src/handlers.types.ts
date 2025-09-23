export type CredentialError = {
  provider: string;
  error: string;
  code?: number;
};

export type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
  credentialIds?: [];
};

export type AutoVerificationFields = AutoVerificationRequestBodyType;

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
  credentialErrors?: CredentialError[];
};
