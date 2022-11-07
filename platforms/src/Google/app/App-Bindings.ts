/* eslint-disable */
import { Platform } from "../../types";

export class GooglePlatform implements Platform {
  async dummy(state: any, window: any, screen: any): Promise<string> {

    return "hello";
  }
  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Google";
  path = "Google";
}
