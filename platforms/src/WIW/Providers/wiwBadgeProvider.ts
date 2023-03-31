// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Constants
const WIW_BADGE_API_ENDPOINT = "https://advanced-api.wiw.io/badges/address/";
export const API_KEY = "N8tXnkmQZNEENN82y4SsttEeAiTG52Qw";
export const BADGE_COUNT_GTE_THRESHOLD = 15;

// ----- Interfaces
interface BadgeApiResponse {
  data?: BadgeApiData;
}

interface BadgeApiData {
  address?: string;
  badge_count?: number;
  badge_list?: [BadgeDetail];
}

interface BadgeDetail {
  id?: string;
  name?: string;
  description?: string;
  icon_url?: string;
  update_time?: string;
}

// Export a WIW Badge Provider
export class WIWBadgeProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "WIWBadgeProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in has enough WIW badges
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    let valid = false;

    try {
      const result: BadgeApiResponse = await axios.get(WIW_BADGE_API_ENDPOINT + address, {
        headers: { Authorization: `${API_KEY}` },
      });
      const badgeApiResponse: BadgeApiData = result.data;
      valid = badgeApiResponse.badge_count >= BADGE_COUNT_GTE_THRESHOLD;
    } catch (e: unknown) {
      valid = false;
    }

    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
            hasWIWBadgeGTEThreshold: String(valid),
          }
        : undefined,
    });
  }
}
