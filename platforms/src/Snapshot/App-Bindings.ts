/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class SnapshotPlatform implements Platform {
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Snapshot";
  path = "Snapshot";
  clientId: string = null;
  redirectUri: string = null;
}
