import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getKycSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { KYC_CREDENTIAL_TYPE } from "../constants.js";

export class HumanIdKycProvider extends BaseHumanIdProvider {
  type = "HolonymGovIdProvider";
  sbtFetcher = getKycSBTByAddress;
  credentialType = KYC_CREDENTIAL_TYPE;
}
