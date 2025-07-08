import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getKycSBTByAddress } from "@holonym-foundation/human-id-sdk";

export class HumanIdKycProvider extends BaseHumanIdProvider {
  type = "HolonymGovIdProvider";
  sbtFetcher = getKycSBTByAddress;
  credentialType = "kyc";
}
