/* eslint-disable */
import { Platform } from "../types";

export class GTCPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "GTC";
  path = "GTC";
}
