import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getKycSBTByAddress } from "@holonym-foundation/human-id-sdk";

export class HumanIdKycProvider extends BaseHumanIdProvider {
  type = "HumanIdKyc";
  sbtFetcher = getKycSBTByAddress;
  credentialType = "kyc";
}
