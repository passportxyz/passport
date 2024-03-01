import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  banner = {
    heading: "Click on 'Get Civic Pass' to visit Civic and request your passes.",
    content: (
      <div>
        You may also use this link to check and update the status of passes. Note: Polygon is recommended for lowest gas
        cost. After passes have been issued to your linked wallet, select the corresponding box(es) below and click
        SAVE. Gitcoin will check for passes and save those that are valid.{" "}
        <a
          href="https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/how-do-i-add-passport-stamps/civic-stamp-verification-guide-for-gitcoin-passport"
          style={{
            color: "rgb(var(--color-foreground-2))",
            textDecoration: "underline",
            cursor: "pointer",
            paddingLeft: "2px",
          }}
          target="_blank"
          rel="noreferrer"
        >
          Learn more
        </a>
        .
      </div>
    ),
    cta: {
      label: "Get Civic Pass",
      url: "https://getpass.civic.com?scope=uniqueness,captcha,liveness&chain=polygon,arbitrum%20one,xdc,ethereum,fantom,optimism,base,avalanche&referrer=gitcoin-passport",
    },
  };
}
