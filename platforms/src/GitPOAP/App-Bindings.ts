/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class GitPOAPPlatform implements Platform {
  async dummy(state: any, window: any, screen: any): Promise<string> {

    return "hello";
  }

  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "GitPOAP";
  path = "GitPOAP";
  clientId: string = null;
  redirectUri: string = null;
}
