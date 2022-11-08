/* eslint-disable */
import { Platform, AccessTokenResult, AppContext, ProviderPayload } from "../types";
export class FacebookPlatform implements Platform {
  path: string;
  platformId = "Facebook";

  //@ts-ignore 'appContext' is defined but never used
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    //@ts-ignore 'appContext' Unexpected empty arrow function
    const result = new Promise<ProviderPayload>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      FB.login(function (response) {
        if (response.status === "connected") {
          resolve({ accessToken: response.authResponse.accessToken });
        } else {
          resolve({ authenticated: false });
        }
      });
    });

    return result;
  }

  async getProviderProof(): Promise<AccessTokenResult> {
    // TODO: remove this method
    // TODO: Shouldn't need all of these ignores, should be just this //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx once tsconfigs are normalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = (await FB.login(function (response) {
      return new Promise((resolve, reject) => {
        if (response.authenticated) {
          resolve({ accessToken: response.accessToken });
        } else {
          reject({ authenticated: false });
        }
      });
    })) as AccessTokenResult;

    return result;
  }
}
