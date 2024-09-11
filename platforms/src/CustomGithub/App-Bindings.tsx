/* eslint-disable */
import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CustomGithubPlatform extends Platform {
  platformId = "CustomGithub";
  path = "CustomGithub";
  isEVM = true;
  clientId: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
