import { Platform } from "../utils/platform";
import axios from "axios";

type TwitterProcResponse = {
  data: {
    authUrl: string;
  };
};
export class TwitterPlatform extends Platform {
  platformId = "Twitter";
  path = "twitter";

  async getOAuthUrl(): Promise<string> {
    // Fetch data from external API
    const res: TwitterProcResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`
    );
    return res.data.authUrl;
  }
}
