/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class PohPlatform implements Platform {
  async dummy(state: any, window: any, screen: any): Promise<string> {

    return "hello";
  }

  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Poh";
  path = "Poh";
  clientId: string = null;
  redirectUri: string = null;
}
