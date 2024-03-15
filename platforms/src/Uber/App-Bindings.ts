import { Platform } from "../utils/platform";
import axios from "axios";
import {} from "@reclaimprotocol/js-sdk";

type UberProcResponse = {
  data: {
    authUrl: string;
  };
};
export class UberPlatform extends Platform {
  platformId = "Uber";
  path = "uber";

  async getOAuthUrl(): Promise<string> {
    // Fetch data from external API
    const res: UberProcResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`
    );
    return res.data.authUrl;
  }
}
