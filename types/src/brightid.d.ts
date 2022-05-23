export type FailResponse = {
  status?: number;
  statusText?: string;
  data?: {
    error: boolean;
    errorNum: number;
    errorMessage: string;
    contextIds?: string[];
    code: number;
  };
};

export type SponsorshipSuccessResponse = {
  status: string;
  statusReason: string;
};

export type VerificationSuccessResponse = {
  unique?: boolean;
  app?: string;
  context?: string;
  contextIds?: string[];
};

export type BrightIdVerificationResponse = FailResponse | VerificationSuccessResponse;

export type BrightIdSponsorshipResponse = FailResponse | SponsorshipSuccessResponse;

export type BrightIdProcedureResponse = {
  valid: boolean;
  result?: BrightIdSponsorshipResponse | BrightIdVerificationResponse;
  error?: string;
};
