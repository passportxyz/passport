/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class FacebookPlatform extends Platform {
  path: string;
  platformId = "Facebook";

  //@ts-ignore 'appContext' is defined but never used
  async getProviderPayload(): Promise<ProviderPayload> {
    //@ts-ignore 'appContext' Unexpected empty arrow function
    const result = new Promise<ProviderPayload>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore assuming FB.init was already called; see facebookSdkScript in app/pages/_app.tsx
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      FB.login(function (response: { authResponse: { accessToken: string }; status: string }) {
        if (response.status === "connected") {
          resolve({ accessToken: response.authResponse.accessToken });
        } else {
          resolve({ authenticated: false });
        }
      });
    });

    return result;
  }
}
