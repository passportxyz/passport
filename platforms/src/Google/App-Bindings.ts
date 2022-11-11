/* eslint-disable */
import { AccessTokenResult, AppContext, Platform, ProviderPayload } from "../types";

export class GooglePlatform implements Platform {
  getProviderProof?(): Promise<AccessTokenResult> {
    throw new Error("Method not implemented.");
  }
  getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    throw new Error("Method not implemented.");
  }
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Google";
  path = "Google";
}
