import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getPhoneSBTByAddress } from "@holonym-foundation/human-id-sdk";

export class HumanIdPhoneProvider extends BaseHumanIdProvider {
  type = "HolonymPhone";
  sbtFetcher = getPhoneSBTByAddress;
  credentialType = "phone";
}
