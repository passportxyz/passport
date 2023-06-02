import { Platform } from "../utils/platform";
import { AuthInfo } from "../types";
import axios from "axios";

type IdenaProcResponse = {
  data: {
    token: string;
  };
};

export class IdenaPlatform extends Platform {
  platformId = "Idena";
  path = "idena";

  async getAuthInfo(): Promise<AuthInfo> {
    const procedureUrl = process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "");
    const idenaCallback = process.env.NEXT_PUBLIC_PASSPORT_IDENA_CALLBACK?.replace(/\/*?$/, "");
    const idenaWebApp = process.env.NEXT_PUBLIC_PASSPORT_IDENA_WEB_APP?.replace(/\/*?$/, "");

    // Fetch data from external API
    const res: IdenaProcResponse = await axios.post(`${procedureUrl}/idena/create-token`);
    const token = res.data.token;

    const callbackUrl = encodeURIComponent(`${idenaCallback}?state=${token}&code=${token}`);
    const endpoint = procedureUrl;
    const nonceEndpoint = `${endpoint}/idena/start-session`;
    const authenticationEndpoint = `${endpoint}/idena/authenticate`;
    const authUrl = `${idenaWebApp}/dna/signin?token=${token}&callback_url=${callbackUrl}&callback_target=_self&nonce_endpoint=${nonceEndpoint}&authentication_endpoint=${authenticationEndpoint}`;

    return {
      authUrl,
      cacheToken: token,
    };
  }
}
