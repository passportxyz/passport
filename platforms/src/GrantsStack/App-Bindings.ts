import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GrantsStackPlatform extends Platform {
  platformId = "GrantsStack";
  path = "GrantsStack";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading:
      "Note: Only Alpha and Beta rounds run by Gitcoin are included. For the Alpha program, only donations larger than $1 are counted. For the Beta program, only matching-eligible contributions are counted. Donations during Grants Round 18 (August '23) will be added by the end of September.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
