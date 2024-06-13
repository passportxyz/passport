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
      const { addressList } = payload.proofs;
      const response: AddressListResponse = await axios.get(`${allowListEndpoint}/${addressList}/${address}`);
      const valid = response.data.on_list;

      return {
        valid,
        record: { address, addressList },
      };
    } catch (e) {
      throw new ProviderExternalVerificationError(String(e));
    }
  }
}
