import axios from "axios";
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class BrightidPlatform extends Platform {
  platformId = "Brightid";
  path = "brightid";
  clientId: string = null;
  redirectUri: string = null;

  async handleVerifyContextId(userDid: string): Promise<boolean> {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/verifyContextId`,
        {
          contextIdData: userDid,
        }
      );
      const { data } = res as { data: { response: { valid: boolean } } };
      return data?.response?.valid;
    } catch (error) {
      return false;
    }
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    if (appContext.userDid) {
      const isVerified = await this.handleVerifyContextId(appContext.userDid);
      if (isVerified) {
        return {
          did: appContext.userDid,
        };
      }
    }

    const authUrl = `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(
      /\/*?$/,
      ""
    )}/brightid/information?callback=${appContext?.callbackUrl}`;
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
          contextIdData: appContext.userDid,
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
