import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";
import {
  AMAZON_CASUAL_PURCHASER_THRESHOLD,
  AMAZON_REGULAR_CUSTOMER_THRESHOLD,
  AMAZON_HEAVY_USER_THRESHOLD,
  UBER_OCCASIONAL_RIDER_THRESHOLD,
  UBER_REGULAR_RIDER_THRESHOLD,
  UBER_POWER_USER_THRESHOLD,
  PROOF_FIELD_MAP,
  ZKEmailRequestPayload,
  type ProviderGroup,
} from "../types.js";
import { Proof } from "@zk-email/sdk";
import { AMAZON_SUBJECT_KEYWORDS, UBER_SUBJECT_KEYWORDS } from "../keywords.js";
import { subjectContainsKeyword, extractSubjectFromPublicData } from "../utils/subject.js";
import { normalizeWalletAddress } from "../utils.js";
import { countVerifiedProofs, getRequestedMaxThreshold, type ZkEmailCacheEntry } from "../utils.js";

function getSubjectFromProof(proof: Proof): string | undefined {
  try {
    const { publicData } = proof.getProofData();
    return extractSubjectFromPublicData(publicData);
  } catch {
    return undefined;
  }
}

function filterProofsBySubject(proofs: Proof[], keywords: string[]): Proof[] {
  return proofs.filter((proof) => {
    const subject = getSubjectFromProof(proof);
    return Boolean(subject) && subjectContainsKeyword(subject as string, keywords);
  });
}

// moved to ZKEmail/utils.ts

type ZkEmailContext = ProviderContext & {
  zkemail?: Partial<Record<ProviderGroup, ZkEmailCacheEntry>>;
};
// group helpers moved to ZKEmail/utils.ts

// Base ZKEmail Provider
abstract class ZKEmailBaseProvider implements Provider {
  type: string;
  _options: ProviderOptions;

  constructor(type: string, options: ProviderOptions = {}) {
    this.type = type;
    this._options = { ...options };
  }

  async verify(payload: RequestPayload, _context?: ProviderContext): Promise<VerifiedPayload> {
    const context = (_context as ZkEmailContext) || ({} as ZkEmailContext);
    const errors: string[] = [];
    const record: { data?: string } | undefined = undefined;

    try {
      // Validate payload structure
      if (!(payload as ZKEmailRequestPayload).proofs) {
        return {
          valid: false,
          errors: ["No proofs provided in payload"],
          record,
        };
      }

      // Validate wallet address exists
      if (!(payload as ZKEmailRequestPayload).address) {
        return {
          valid: false,
          errors: ["No wallet address provided in payload"],
          record,
        };
      }

      // Get the appropriate proof type for this provider
      const proofType = this.getProofType();
      const proofsField = PROOF_FIELD_MAP[proofType];

      if (!(payload as ZKEmailRequestPayload).proofs[proofsField]) {
        return {
          valid: false,
          errors: [`No ${proofType} proofs provided in payload`],
          record,
        };
      }

      // Per-request cache keyed by group (amazon/uber) to avoid re-verifying across variants
      context.zkemail = context.zkemail || {};
      const cached = context.zkemail[proofType as ProviderGroup];

      const { initZkEmailSdk } = await import("@zk-email/sdk");
      const sdk = initZkEmailSdk();

      const proofs = (payload as ZKEmailRequestPayload).proofs![proofsField] as string[];

      if (!Array.isArray(proofs) || proofs.length === 0) {
        return {
          valid: false,
          errors: [`Invalid or empty ${proofType} proofs array`],
          record,
        };
      }

      // Normalize the requesting wallet once
      const normalizedRequestWallet = normalizeWalletAddress((payload as ZKEmailRequestPayload).address as string);

      // Unpack proofs and validate wallet binding
      const unpackedProofs =
        cached?.unpackedProofs ||
        (await Promise.all(
          proofs.map(async (p: string) => {
            const proof = await sdk.unPackProof(p);

            // Extract and verify wallet from public data
            const { externalInputs } = proof.getProofData();
            const proofWallet = normalizeWalletAddress(externalInputs.wallet_address);

            if (!proofWallet) {
              throw new Error("Proof missing wallet_address in public data");
            }

            if (proofWallet !== normalizedRequestWallet) {
              throw new Error(
                `Proof not bound to requesting wallet. Expected ${normalizedRequestWallet}, found ${proofWallet}`
              );
            }

            return proof;
          })
        ));

      // Filter proofs by subject keywords depending on proof type
      const subjectKeywords = proofType === "amazon" ? AMAZON_SUBJECT_KEYWORDS : UBER_SUBJECT_KEYWORDS;
      const subjectFilteredProofs =
        cached?.subjectFilteredProofs || filterProofsBySubject(unpackedProofs, subjectKeywords);

      // Determine thresholds: provider-specific and group max (for compute-once strategy)
      const threshold = this.getThreshold();
      const requestedMax = getRequestedMaxThreshold(proofType as ProviderGroup, payload.types);

      let validProofCount: number | undefined;

      // Compute once up to requested max threshold for this group, then reuse across variants
      if (typeof cached?.validCountMaxUpTo === "number") {
        validProofCount = cached.validCountMaxUpTo;
      } else {
        const computedToRequestedMax = await countVerifiedProofs(subjectFilteredProofs, requestedMax);
        let store: ZkEmailCacheEntry;
        if (cached) {
          store = cached;
        } else {
          store = {
            unpackedProofs,
            subjectFilteredProofs,
          };
        }
        store.validCountMaxUpTo = computedToRequestedMax;
        context.zkemail[proofType as ProviderGroup] = store;
        validProofCount = computedToRequestedMax;
      }

      if (validProofCount === 0) {
        return {
          valid: false,
          errors: [`No valid ${proofType} proofs found`],
          record,
        };
      }

      // Check if the proof count meets the threshold for this specific provider
      if (validProofCount < threshold) {
        return {
          valid: false,
          errors: [`Need at least ${threshold} valid ${proofType} proofs, but only found ${validProofCount}`],
          record,
        };
      }

      return {
        valid: true,
        errors,
        record: {
          totalProofs: validProofCount.toString(),
          proofType: proofType,
        },
      };
    } catch (error) {
      errors.push(`Failed to verify email: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        errors,
        record,
      };
    }
  }

  abstract getThreshold(): number;
  abstract getProofType(): "amazon" | "uber";
}

// Amazon Providers
export class AmazonCasualPurchaserProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#AmazonCasualPurchaser");
  }

  getThreshold(): number {
    return AMAZON_CASUAL_PURCHASER_THRESHOLD;
  }

  getProofType(): "amazon" {
    return "amazon";
  }
}

export class AmazonRegularCustomerProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#AmazonRegularCustomer");
  }

  getThreshold(): number {
    return AMAZON_REGULAR_CUSTOMER_THRESHOLD;
  }

  getProofType(): "amazon" {
    return "amazon";
  }
}

export class AmazonHeavyUserProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#AmazonHeavyUser");
  }

  getThreshold(): number {
    return AMAZON_HEAVY_USER_THRESHOLD;
  }

  getProofType(): "amazon" {
    return "amazon";
  }
}

// Uber Providers
export class UberOccasionalRiderProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#UberOccasionalRider");
  }

  getThreshold(): number {
    return UBER_OCCASIONAL_RIDER_THRESHOLD;
  }

  getProofType(): "uber" {
    return "uber";
  }
}

export class UberRegularRiderProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#UberRegularRider");
  }

  getThreshold(): number {
    return UBER_REGULAR_RIDER_THRESHOLD;
  }

  getProofType(): "uber" {
    return "uber";
  }
}

export class UberPowerUserProvider extends ZKEmailBaseProvider {
  constructor() {
    super("ZKEmail#UberPowerUser");
  }

  getThreshold(): number {
    return UBER_POWER_USER_THRESHOLD;
  }

  getProofType(): "uber" {
    return "uber";
  }
}
