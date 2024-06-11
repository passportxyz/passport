import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider } from "../../types";

export class AllowListProvider implements Provider {
  type = "AllowList";
  

  // constructor(options: { allowList: string }) {
  //   this.allowList = options.allowList;
  // }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    return await Promise.resolve({
      valid: true,
      record: { address: payload.address },
    });
  }
}
