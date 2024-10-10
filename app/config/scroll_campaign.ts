import { PROVIDER_ID } from "@gitcoin/passport-types";
import { chains, scrollChainId } from "../utils/chains";

export function loadBadgeProviders(): {
  badgeContractAddress: string;
  title: string;
  providers: {
    name: PROVIDER_ID;
    image: string;
    level: number;
  }[];
}[] {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_SCROLL_BADGE_PROVIDER_INFO || "[]");
  } catch (e) {
    console.error(
      "Error parsing NEXT_PUBLIC_SCROLL_BADGE_PROVIDER_INFO:",
      process.env.NEXT_PUBLIC_SCROLL_BADGE_PROVIDER_INFO
    );
    return [];
  }
}

export const badgeContractInfo = loadBadgeProviders();

export const scrollCampaignBadgeProviderInfo = badgeContractInfo.reduce(
  (acc, { badgeContractAddress, providers, title }) => {
    providers.forEach(({ name, level, image }) => {
      acc[name] = {
        contractAddress: badgeContractAddress,
        level,
        image,
        title,
      };
    });
    return acc;
  },
  {} as Record<PROVIDER_ID, { contractAddress: string; level: number; image: string; title: string }>
);

export const scrollCampaignBadgeProviders = Object.keys(scrollCampaignBadgeProviderInfo) as PROVIDER_ID[];

export const scrollCampaignBadgeContractAddresses = badgeContractInfo.map(
  ({ badgeContractAddress }) => badgeContractAddress
);

const SCROLL_CHAIN_ID = process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_CHAIN_ID || scrollChainId;
export const scrollCampaignChain = chains.find(({ id }) => id === SCROLL_CHAIN_ID);

if (scrollCampaignBadgeProviders.length === 0) {
  console.error("No NEXT_PUBLIC_SCROLL_BADGE_PROVIDER_INFO has been configured");
}
