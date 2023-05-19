import { ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  getProviderPayload(): Promise<ProviderPayload> {
    return Promise.resolve({});
  }
}
