import axios from "axios";
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class BrightidPlatform extends Platform {
  platformId = "Brightid";
  path = "brightid";
  clientId: string = null;
  redirectUri: string = null;

  // TODO change return type
  async getBrightidInfoForUserDid(userDid: string): Promise<any> {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/getUserInfo`,
        {
          contextIdData: userDid,
        }
      );
      const { data } = res;
      console.log("bidinfo", res);
      return data.response;
    } catch (e) {
      return {};
    }
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const { userDid } = appContext;
    if (userDid) {
      const result = await this.getBrightidInfoForUserDid(userDid);
      const { valid, appUserId } = result;

      if (valid) {
        return {
          did: userDid,
        };
      }

      const authUrl = `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(
        /\/*?$/,
        ""
      )}/brightid/information?callback=${appContext?.callbackUrl}&appUserId=${appUserId}`;
      const width = 600;
      const height = 800;
      const left = appContext.screen.width / 2 - width / 2;
      const top = appContext.screen.height / 2 - height / 2;

      // Pass data to the page via props
      appContext.window.open(
        authUrl,
        "_blank",
        `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );

      return appContext.waitForRedirect().then(async (response) => {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`,
          {
            contextIdData: userDid,
          }
        );
        const { data } = res as { data: { response: { valid: boolean } } };

        return {
          code: data?.response?.valid ? "success" : "error",
          sessionKey: response.state,
        };
      });
    }
  }
}
