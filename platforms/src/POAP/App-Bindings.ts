/* eslint-disable */
import { Platform } from "../types";

export class POAPPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Poap";
  path = "Poap";
}
