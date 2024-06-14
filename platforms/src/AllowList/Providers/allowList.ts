import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import axios from "axios";

export const allowListEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/allow-list`;

export interface AllowListResponse {
  data: {
    is_member: boolean;
  };
}

export class AllowListProvider implements Provider {
  type = "AllowList";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const { address } = payload;
      const { allowList } = payload.proofs;
      const response: AllowListResponse = await axios.get(`${allowListEndpoint}/${allowList}/${address}`);
      const valid = response.data.is_member;

      return {
        valid,
        record: { address, allowList },
      };
    } catch (e) {
      throw new ProviderExternalVerificationError(String(e));
    }
  }
}
