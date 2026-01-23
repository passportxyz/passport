import { Platform } from "../utils/platform.js";
import axios from "axios";
import React from "react";

type XProcResponse = {
  data: {
    authUrl: string;
  };
};

export class XPlatform extends Platform {
  platformId = "X";
  path = "twitter";

  banner = {
    heading: "X (Twitter) Stamp Requirements",
    content: (
      <div>
        <p>To earn this stamp, your X account must meet the following criteria:</p>
        <ul style={{ listStyle: "disc", paddingLeft: "20px" }}>
          <li>Verified account (Premium, Premium+, Government, Business, or Legacy)</li>
          <li>At least 100 followers</li>
          <li>Account age older than 365 days</li>
        </ul>
      </div>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-x-stamp",
    },
  };

  async getOAuthUrl(): Promise<string> {
    // Fetch data from external API (procedure router)
    const res: XProcResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/twitter/generateAuthUrl`
    );
    return res.data.authUrl;
  }
}
