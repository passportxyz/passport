import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
import React from "react";

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" className="text-color-1 cursor-pointer underline">
    {children}
  </a>
);

export class TrustaLabsPlatform extends Platform {
  platformId = "TrustaLabs";
  path = "TrustaLabs";
  isEVM = true;

  banner = {
    content: (
      <div>
        This uses Trusta&apos;s <Link href="https://www.trustalabs.ai/trustscan">TrustScan</Link> product based on your
        activities on Eth Mainnet. You will not be able to claim the stamp if you lack sufficient data or have Sybil
        like patterns they have detected. Note, the MEDIA score for zkSync is different from this score. For more
        questions please see their{" "}
        <Link href="https://trusta-labs.gitbook.io/trustalabs/trustscan/q-and-a-for-sybil-score">Q&A</Link>.
      </div>
    ),
  };

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    return await Promise.resolve({});
  }
}
