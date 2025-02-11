export type AutoVerificationRequestBodyType = {
  address: string;
  scorerId: string;
  credentialIds?: [];
};

export type AutoVerificationFields = AutoVerificationRequestBodyType;

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};
