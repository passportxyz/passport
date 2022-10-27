import { Platform, PlatformOptions } from "../types";

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
  async getOAuthUrl (state: string): Promise<string> {
    // TODO: implement this
    // Fetch data from external API
    // const res = await fetch(
    //   `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       callback: process.env.NEXT_PUBLIC_PASSPORT_TWITTER_CALLBACK,
    //     }),
    //   }
    // );
    // const data = await res.json();
    // return data.authUrl;
    return "/TODO/";
  };
};
