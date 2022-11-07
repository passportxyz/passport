/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class ETHPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "ETH";
  path = "ETH";
  clientId: string = null;
  redirectUri: string = null;
}
