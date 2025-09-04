import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getPhoneSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { PHONE_CREDENTIAL_TYPE } from "../constants.js";

export class HumanIdPhoneProvider extends BaseHumanIdProvider {
  type = "HolonymPhone";
  sbtFetcher = getPhoneSBTByAddress;
  credentialType = PHONE_CREDENTIAL_TYPE;
}
