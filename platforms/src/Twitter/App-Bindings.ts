import { Platform } from "../utils/platform";
import { AuthInfo } from "../types";
import axios from "axios";

type TwitterProcResponse = {
  data: {
    authUrl: string;
    cacheToken: string;
  };
};
export class TwitterPlatform extends Platform {
  platformId = "Twitter";
  path = "twitter";

  async getAuthInfo(): Promise<AuthInfo> {
    // Fetch data from external API
    const res: TwitterProcResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`,
      {
        callback: process.env.NEXT_PUBLIC_PASSPORT_TWITTER_CALLBACK,
      }
    );

    const { authUrl, cacheToken } = res.data;

    return { authUrl, cacheToken };
  }
}
