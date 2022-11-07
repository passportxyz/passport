/* eslint-disable */
import { Platform, PlatformOptions } from "../types";



export class GithubPlatform implements Platform {
  platformId = "Github";
  path = "github";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }


  async dummy(state: any, window: any, screen: any): Promise<string> {
    // TODO: open the BroadCastChannel
    // TODO: register the event handler - onmessage

    const authUrl: string = await this.getOAuthUrl(state);
    const width = 600;
    const height = 800;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    // Pass data to the page via props
    window.open(
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
    return "hello";
  }

  async getOAuthUrl(state: string): Promise<string> {
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`;
    return githubUrl;
  }
}
