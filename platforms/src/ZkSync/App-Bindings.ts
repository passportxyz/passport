/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AccessTokenResult, Platform } from "../types";
export class ZkSyncPlatform implements Platform {
  path: string;
  platformId = "ZkSync";

  async dummy(state: any, window: any, screen: any): Promise<string> {

    return "hello";
  }

  
  async getProviderProof(): Promise<AccessTokenResult> {
    const result = await Promise.resolve({ authenticated: true, proofs: {} });
    return result;
  }
}
