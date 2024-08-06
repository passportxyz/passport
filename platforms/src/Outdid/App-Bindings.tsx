import React from "react";
import axios from "axios";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
import { Hyperlink } from "../utils/Hyperlink";

export class OutdidPlatform extends Platform {
  platformId = "Outdid";
  path = "outdid";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading: (
      <>
        To get the Stamp:
        <br className="mb-1" />
        <ol>
          <li className="mt-1">Step 1: Click the button below &ldquo;Get Stamp&rdquo;</li>
          <li className="mt-1">
            Step 2: Select the country of your identity document and the type of document (eg. Germany, passport)
          </li>
          <li className="mt-1">Step 3: Scan the QR code, download our app and scan your passport.</li>
          <li className="mt-1">Step 4: You got your Stamp.</li>
        </ol>
        <br />
        Need help? Message us at <Hyperlink href="http://t.me/outdidsupport">t.me/outdidsupport</Hyperlink>
        <br />
        <br />
        Outdid is an app which scans the NFC chip of your passport and generates a Zero-Knowledge Proof that you are a
        unique human. All of your private data stays on your phone - not even Outdid can see it 🙂
      </>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-outdid-stamp-to-passport",
    },
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const width = 800;
    const height = 900;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;
    const windowReference = appContext.window.open(
      "about:blank",
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    ) as unknown as Window;

    if (windowReference === null || windowReference === undefined) {
      throw new Error("Failed to open popup window");
    }

    try {
      const { successRedirect, verificationID } = (
        await axios.post(`${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/outdid/connect`, {
          callback: `${this.redirectUri}?error=false&code=null&state=${appContext.state}`,
          userDid: appContext.userDid,
        })
      ).data as { successRedirect: string; verificationID: string };

      windowReference.location = successRedirect;

      const response = await appContext.waitForRedirect(this);

      return {
        verificationID,
        code: "success",
        sessionKey: response.state,
        userDid: appContext.userDid,
      };
    } catch (e) {
      windowReference.close();
      throw e;
    }
  }
}
