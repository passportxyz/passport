/* eslint-disable */
import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CustomGithubPlatform extends Platform {
  platformId = "DeveloperList";
  path = "DeveloperList";
  isEVM = false;
  clientId: string = null;

  constructor(options: PlatformOptions = {}) {
    // TODO need github client id and redirect uri ?
    super();
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    // TODO github oauth ?
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
