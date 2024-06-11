import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import axios from "axios";

export const allowListEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/allow-list`;

export interface AllowListResponse {
  data: {
    on_list: boolean;
  };
}

export class AllowListProvider implements Provider {
  type = "AllowList";
  

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const { address } = payload;
      const {allowListType} = payload.proofs;
      const response: AllowListResponse = await axios.get(`${allowListEndpoint}/${allowListType}/${address}`);
      const valid = response.data.on_list;

      return {
        valid,
        record: { address },
      }
    } catch (e) {
      throw new ProviderExternalVerificationError(String(e));
    } 
  }
}
