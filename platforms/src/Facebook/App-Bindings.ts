/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Platform, CallbackParameters } from "../types";
export class FacebookPlatform implements Platform {
  path: string;
  platformId = "Facebook";

  getAccessToken(callback: (params: CallbackParameters) => void): void {
    // TODO: Shouldn't need all of these ignores, should be just this //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx once tsconfigs are normalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    FB.login(function (response) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (response.authenticated) {
        callback({
          authenticated: true,
          proofs: { accessToken: response.accessToken },
        });
      } else {
        callback({ authenticated: false });
      }
    });
    return;
  }
}
