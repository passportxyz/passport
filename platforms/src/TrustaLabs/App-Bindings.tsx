import { Hyperlink } from "../utils/Hyperlink.js";
import { AppContext, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import React from "react";

export class TrustaLabsPlatform extends Platform {
  platformId = "TrustaLabs";
  path = "TrustaLabs";
  isEVM = true;

  banner = {
    content: (
      <div>
        This uses Trusta&apos;s <Hyperlink href="https://www.trustalabs.ai/trustscan">TrustScan</Hyperlink> product
        based on your activities on Eth Mainnet. You will not be able to claim the Stamp if you lack sufficient data or
        have Sybil like patterns they have detected. Note, the MEDIA score for zkSync is different from this score. For
        more questions please see their{" "}
        <Hyperlink href="https://trusta-labs.gitbook.io/trustalabs/trustscan/q-and-a-for-sybil-score">Q&A</Hyperlink>.
      </div>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-trusta-labs-stamp-to-passport",
    },
  };

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    return await Promise.resolve({});
  }
}
