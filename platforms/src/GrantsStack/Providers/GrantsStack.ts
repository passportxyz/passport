import type { Provider, ProviderOptions } from "../../types";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export class GrantsStackProvider implements Provider {
  type = "GrantsStack";

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    return await Promise.resolve({
      valid: true,
      record: {
        challenge: "GrantsStack",
      },
    });
  }
}
