import { type Provider } from "../../types.js";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

type Attestation = {
  fullSchemaId: string;
  attester: "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd";
  isReceiver: boolean;
  revoked: boolean;
  validUntil: number;
  indexingValue: string;
};

type CleanHandsResponseData = {
  success: boolean;
  statusCode: number;
  data: {
    total: number;
    rows: Attestation[];
    page: number;
    size: number;
  };
  message: string;
};

type CleanHandsResponse = {
  data: CleanHandsResponseData;
};

export class ClanHandsProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "CleanHands";

  constructor() {}

  async verify(payload: RequestPayload, context: any): Promise<VerifiedPayload> {
    let valid = false;
    let errors: string[] | undefined = undefined;
    let record:
      | {
          [k: string]: string;
        }
      | undefined = undefined;

    try {
      // Set user address
      const address = payload.address.toLowerCase();

      const resp: CleanHandsResponse = await axios.get(
        `https://mainnet-rpc.sign.global/api/scan/addresses/${address}/attestations`
      );
      const data = resp.data;

      const cleanHandsAttestations = data.data.rows.find(
        (att) =>
          att.fullSchemaId == "onchain_evm_10_0x8" &&
          att.attester == "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd" &&
          att.isReceiver == true &&
          !att.revoked &&
          att.validUntil > new Date().getTime() / 1000
      );
      // Make sure cleanHandsAttestations and cleanHandsAttestations.indexingValue are not undefined or null
      valid = !!cleanHandsAttestations?.indexingValue;
      errors = valid ? undefined : [`Unable to find any valid attestation for ${address}`];
      record = !valid ? undefined : { id: cleanHandsAttestations?.indexingValue };
    } catch (error) {
      handleProviderAxiosError(error, "CleanHands");
    }

    return {
      valid,
      errors,
      record,
    };
  }
}
