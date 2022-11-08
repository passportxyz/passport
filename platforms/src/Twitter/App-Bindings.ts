/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";
import axios from "axios";

type TwitterProcResponse = {
  data: {
    authUrl: string;
  };
};
export class TwitterPlatform implements Platform {
  platformId = "Twitter";
  path = "twitter";
  clientId: string = null;
  redirectUri: string = null;
  state: string = null;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const authUrl: string = await this.getOAuthUrl(appContext.state);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Pass data to the page via props
    appContext.window.open(
      authUrl,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );

    return appContext.waitForRedirect().then((data) => {
      return {
        code: data.code,
        sessionKey: data.state,
        signature: data.signature,
      }
    });
  }

  async getOAuthUrl(state: string): Promise<string> {
    // Fetch data from external API
    const res = (await axios.post(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`,
      {
        callback: process.env.NEXT_PUBLIC_PASSPORT_TWITTER_CALLBACK,
      }
    )) as TwitterProcResponse;
    return res.data.authUrl;
  }
}
