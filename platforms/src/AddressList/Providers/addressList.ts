import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import axios from "axios";

export const allowListEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/allow-list`;

export interface AddressListResponse {
  data: {
    on_list: boolean;
  };
}

export class AddressListProvider implements Provider {
  type = "AddressList";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const { address } = payload;
      const { allowList } = payload.proofs;
      const response: AddressListResponse = await axios.get(`${allowListEndpoint}/${allowList}/${address}`);
      const valid = response.data.on_list;

      return {
        valid,
        record: { address, allowList },
      };
    } catch (e) {
      throw new ProviderExternalVerificationError(String(e));
    }
  }
}
