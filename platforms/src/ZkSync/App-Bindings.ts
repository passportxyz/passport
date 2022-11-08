/* eslint-disable */
import { AccessTokenResult, Platform, ProviderPayload, AppContext } from "../types";
export class ZkSyncPlatform implements Platform {
  path: string;
  platformId = "ZkSync";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  async getProviderProof(): Promise<AccessTokenResult> {
    const result = await Promise.resolve({ authenticated: true, proofs: {} });
    return result;
  }
}
