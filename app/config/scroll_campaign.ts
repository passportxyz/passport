import { PROVIDER_ID } from "@gitcoin/passport-types";

export function loadBadgeProviders() {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_SELECTED_PROVIDERS || "[]");
  } catch (e) {
    console.error(
      "Error parsing NEXT_PUBLIC_SCROLL_CAMPAIGN_SELECTED_PROVIDERS:",
      process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_SELECTED_PROVIDERS
    );
    return [];
  }
}

export const scrollCampaignBadgeProviders: PROVIDER_ID[] = loadBadgeProviders();
if (scrollCampaignBadgeProviders.length === 0) {
  console.error("No NEXT_PUBLIC_SCROLL_CAMPAIGN_SELECTED_PROVIDERS have been configured");
}
