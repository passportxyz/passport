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

  banner = {
    heading: "How to get your Civic Pass",
    content: "Visit the Civic website to get your Civic Pass.",
    cta: {
      label: "Get Civic Pass",
      url: "https://demopass.civic.com/status#polygon",
    },
  };
}
