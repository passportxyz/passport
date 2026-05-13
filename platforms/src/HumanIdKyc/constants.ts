import { CredentialType } from "@holonym-foundation/human-id-sdk";
import type { KycOptions } from "@holonym-foundation/human-id-interface-core";

export const KYC_CREDENTIAL_TYPE: CredentialType = "kyc";

// freeZKPassport is omitted from the public requestSBT type but accepted by
// privateRequestSBT at runtime — the cast in HumanID/shared/types.ts makes
// the unrestricted KycOptions reachable.
export const KYC_OPTIONS: KycOptions = {
  regularKYC: true,
  paidZKPassport: true,
  freeZKPassport: true,
};
