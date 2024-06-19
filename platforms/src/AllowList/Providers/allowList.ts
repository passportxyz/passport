import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import axios from "axios";

export const allowListEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}account/allow-list`;
const apiKey = process.env.SCORER_API_KEY;

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
      const response: AllowListResponse = await axios.get(`${allowListEndpoint}/${allowList}/${address}`, {
        headers: { Authorization: process.env.CGRANTS_API_TOKEN },
      });
      const valid = response.data.is_member;

      return {
        valid,
        record: { address, allowList },
        errors: valid ? [] : [`${address} was not found on the list`],
      };
    } catch (e) {
      throw new ProviderExternalVerificationError(String(e));
    }
  }
}
