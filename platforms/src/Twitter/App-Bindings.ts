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
    return {};
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
