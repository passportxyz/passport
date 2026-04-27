import {
  BaseHumanIdProvider,
  CredentialSource,
  CredentialSourceResult,
  sbtSource,
} from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getKycSBTByAddress, getZkPassportSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { getZkPassportFreeOffChainAttestation, validateOffChainAttestation } from "../../HumanID/shared/utils.js";
import { KYC_CREDENTIAL_TYPE } from "../constants.js";

/**
 * Free ZK Passport off-chain attestation source. The attestation has a 7-day TTL,
 * so we propagate the remaining lifetime as `expiresInSeconds` — the IAM credential
 * issuer (identity/src/credentials.ts) clamps the VC's expirationDate accordingly.
 */
const zkPassportOffChainSource: CredentialSource = async (address): Promise<CredentialSourceResult> => {
  const attestation = await getZkPassportFreeOffChainAttestation(address);
  const result = validateOffChainAttestation(attestation);
  if (!result.valid) return { valid: false, error: (result as any).error };

  const expiresInSeconds = Math.floor((result.expiresAt.getTime() - Date.now()) / 1000);
  return {
    valid: true,
    record: {
      // attestation is non-null when validateOffChainAttestation says valid
      nullifier: attestation!.payload.uniqueIdentifier,
      sbtType: "zk-passport-offchain",
    },
    expiresInSeconds,
  };
};

/**
 * Government ID provider. Accepts any of three Human ID issuance paths:
 *   1. Regular KYC SBT (Onfido, $5)
 *   2. Paid ZK Passport SBT ($3) — V3ZKPassportSybilResistance
 *   3. Free ZK Passport off-chain attestation (7-day TTL)
 *
 * Provider type stays "HolonymGovIdProvider" so existing scorer weights and stamps
 * don't move. First valid source wins.
 */
export class HumanIdKycProvider extends BaseHumanIdProvider {
  type = "HolonymGovIdProvider";
  credentialType = KYC_CREDENTIAL_TYPE;

  protected sources(): CredentialSource[] {
    return [
      sbtSource(getKycSBTByAddress),
      sbtSource(getZkPassportSBTByAddress, { sbtType: "zk-passport-onchain" }),
      zkPassportOffChainSource,
    ];
  }
}
