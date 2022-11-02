/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class LensPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Lens";
  path = "Lens";
  clientId: string = null;
  redirectUri: string = null;
}
