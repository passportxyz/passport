import { Platform } from "../utils/platform";
import axios from "axios";

type IdenaProcResponse = {
  data: {
    token: string;
  };
};

export class IdenaPlatform extends Platform {
  platformId = "Idena";
  path = "idena";

  async getOAuthUrl(): Promise<string> {
    const procedureUrl = process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "");
    const idenaCallback = process.env.NEXT_PUBLIC_PASSPORT_IDENA_CALLBACK?.replace(/\/*?$/, "");
    const idenaWebApp = process.env.NEXT_PUBLIC_PASSPORT_IDENA_WEB_APP?.replace(/\/*?$/, "");

    // Fetch data from external API
    const res: IdenaProcResponse = await axios.post(`${procedureUrl}/idena/create-token`);
    const token = res.data.token;

    const callbackUrl = encodeURIComponent(`${idenaCallback}?state=${token}&code=${token}`);
    const nonceEndpoint = `${procedureUrl}/idena/start-session`;
    const authenticationEndpoint = `${procedureUrl}/idena/authenticate`;
    return `${idenaWebApp}/dna/signin?token=${token}&callback_url=${callbackUrl}&callback_target=_self&nonce_endpoint=${nonceEndpoint}&authentication_endpoint=${authenticationEndpoint}`;
  }
}
