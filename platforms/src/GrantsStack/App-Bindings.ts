import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GrantsStackPlatform extends Platform {
  platformId = "GrantsStack";
  path = "GrantsStack";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading: `Note: Only Alpha and Beta rounds run by Gitcoin are included, and only
    donations of $1 or larger are counted. For the Beta program, only matching-eligible
    contributions are counted. Donations during Grants Round 18 (August '23) will be
    added by the end of September.`,
  };

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
