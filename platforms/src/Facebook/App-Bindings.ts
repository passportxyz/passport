/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Platform, AccessTokenResult, AppContext, ProviderPayload } from "../types";
export class FacebookPlatform implements Platform {
  path: string;
  platformId = "Facebook";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  
  async getProviderProof(): Promise<AccessTokenResult> {
    // TODO: Shouldn't need all of these ignores, should be just this //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx once tsconfigs are normalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = (await FB.login(function (response) {
      return new Promise((resolve) => {
        if (response.authenticated) {
          resolve({ authenticated: true, proofs: { accessToken: response.accessToken } });
        } else {
          resolve({ authenticated: false });
        }
      });
    })) as AccessTokenResult;

    return result;
  }
}
