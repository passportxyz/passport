// ----- Types
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";

// ----- Twitter OAuth2 library (reused for X)
import { getAuthClient, TwitterContext } from "../../Twitter/procedures/twitterOauth.js";
import { TwitterApiReadOnly } from "twitter-api-v2";

// Export an X Provider to carry out OAuth and return a record object
export class XProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "X";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context?: ProviderContext): Promise<VerifiedPayload> {
    const errors: string[] = [];
    let valid = false;
    let record = undefined;

    try {
      const twitterContext = context as TwitterContext;
      const sessionKey = payload.proofs.sessionKey;
      const code = payload.proofs.code;

      if (!sessionKey || !code) {
        errors.push("Missing OAuth session data. Please try connecting your X account again.");
        return { valid: false, errors };
      }

      // Get authenticated Twitter/X client using existing OAuth infrastructure
      const twitterClient = await getAuthClient(sessionKey, code, twitterContext);

      // Fetch user data with all required fields
      const userData = await fetchXUserData(twitterClient);

      // Check if we have valid user data
      if (!userData?.id) {
        errors.push("We were not able to verify an X account with your provided credentials.");
        return { valid: false, errors };
      }

      const userId = userData.id;
      const followersCount = userData.public_metrics?.followers_count || 0;
      const createdAt = userData.created_at;
      const verified = userData.verified;
      const verified_type = userData.verified_type;

      // Check follower count (at least 100 followers)
      if (followersCount < 100) {
        errors.push(`Your X account has ${followersCount} followers. This stamp requires at least 100 followers.`);
      }

      // Check account age (> 365 days)
      if (createdAt) {
        const accountCreationDate = new Date(createdAt);
        const daysSinceCreation = Math.floor((Date.now() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceCreation <= 365) {
          errors.push(
            `Your X account is ${daysSinceCreation} days old. This stamp requires accounts older than 365 days.`
          );
        }
      } else {
        errors.push("Unable to verify account creation date.");
      }

      // Check verified status (Premium, Premium+, Government, Business, or Legacy)
      // According to X API v2, verified_type can be:
      // - "blue" - Premium ($8/month)
      // - "blue_plus" - Premium+ ($16/month)
      // - "gold" - Business ($1,000/month)
      // - "gray" - Government verified
      // - "blue_legacy" - Pre-Elon legacy verification
      // Also accepts verified === true for legacy accounts without verified_type
      const acceptedVerifiedTypes = ["blue", "blue_plus", "gold", "gray", "blue_legacy"];

      const hasVerification =
        acceptedVerifiedTypes.includes(userData.verified_type || "") || userData.verified === true;

      if (!hasVerification) {
        errors.push("This stamp requires a verified X account (Premium, Premium+, Government, Business, or Legacy).");
      }

      // All criteria must be met
      valid = errors.length === 0;

      if (valid) {
        record = {
          id: userId,
        };
      }

      return {
        valid,
        record,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`X account check error: ${String(e)}`);
    }
  }
}

type XUserData = {
  id?: string;
  username?: string;
  created_at?: string;
  public_metrics?: {
    followers_count?: number;
  };
  verified?: boolean;
  verified_type?: string;
};

const fetchXUserData = async (twitterClient: TwitterApiReadOnly): Promise<XUserData> => {
  try {
    // Fetch user data with metrics, created_at, and verification status
    const user = await twitterClient.v2.me({
      "user.fields": ["created_at", "public_metrics", "verified", "verified_type"],
    });

    return {
      id: user.data.id,
      username: user.data.username,
      created_at: user.data.created_at,
      public_metrics: {
        followers_count: user.data.public_metrics?.followers_count,
      },
      verified: user.data.verified,
      verified_type: user.data.verified_type,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new ProviderExternalVerificationError(`Error fetching X user data: ${error.message}`);
    }
    throw new ProviderExternalVerificationError("Error fetching X user data");
  }
};
