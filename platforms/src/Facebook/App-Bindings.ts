/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Platform } from "../types";

export class FacebookPlatform implements Platform {
  path: string;
  platformId = "Gitcoin";

  async getAccessToken(): Promise<{ [k: string]: string } | boolean> {
    // TODO: Shouldn't need all of these ignores, should be just this //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx once tsconfigs are normalized
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await FB.login(function (response) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (response.status === "connected") {
        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          accessToken: response.accessToken,
        };
      } else {
        return false;
      }
    });
  }
}
