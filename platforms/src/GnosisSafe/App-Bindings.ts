/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class GnosisSafePlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async dummy(state: any, window: any, screen: any): Promise<string> {

    return "hello";
  }

  
  platformId = "GnosisSafe";
  path = "GnosisSafe";
  clientId: string = null;
  redirectUri: string = null;
}
