/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class EnsPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Ens";
  path = "Ens";
  clientId: string = null;
  redirectUri: string = null;
}
