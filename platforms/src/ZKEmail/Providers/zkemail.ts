import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";

// Tier thresholds
const AMAZON_TIERS = {
  CASUAL_PURCHASER: 1,
  REGULAR_CUSTOMER: 10,
  HEAVY_USER: 50,
};

const UBER_TIERS = {
  OCCASIONAL_RIDER: 3,
  REGULAR_RIDER: 25,
  POWER_USER: 100,
};

export class ZKEmailProvider implements Provider {
  type = "ZKEmail";
  _options = {};

  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  private getAmazonTier(purchases: number): string {
    if (purchases >= AMAZON_TIERS.HEAVY_USER) return "Heavy User";
    if (purchases >= AMAZON_TIERS.REGULAR_CUSTOMER) return "Regular Customer";
    if (purchases >= AMAZON_TIERS.CASUAL_PURCHASER) return "Casual Purchaser";
    return "";
  }

  private getUberTier(rides: number): string {
    if (rides >= UBER_TIERS.POWER_USER) return "Power User";
    if (rides >= UBER_TIERS.REGULAR_RIDER) return "Regular Rider";
    if (rides >= UBER_TIERS.OCCASIONAL_RIDER) return "Occasional Rider";
    return "";
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let record = undefined;
    const errors = [];

    // const verifiedPayload = await verifyZKEmail(payload.proofs.code);
    const verifiedPayload = await Promise.resolve({
      amazon: 20,
      uber: 10,
      errors: [],
      emailVerified: true,
    });
    const valid = !verifiedPayload.errors && verifiedPayload.emailVerified;

    if (valid) {
      const amazonTier = this.getAmazonTier(verifiedPayload.amazon);
      const uberTier = this.getUberTier(verifiedPayload.uber);

      record = {
        amazonPurchases: verifiedPayload.amazon.toString(),
        amazonTier: amazonTier || "Not Qualified",
        uberRides: verifiedPayload.uber.toString(),
        uberTier: uberTier || "Not Qualified",
      };
    } else {
      errors.push("We couldn't verify the ZK Email you attempted to authorize with.");
    }

    if (verifiedPayload.errors) {
      errors.push(...verifiedPayload.errors);
    }

    return {
      valid,
      errors,
      record,
    };
  }
}
