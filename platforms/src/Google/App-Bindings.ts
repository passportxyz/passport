/* eslint-disable */
import { Platform } from "../types";

export class GooglePlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Google";
  path = "Google";
}
