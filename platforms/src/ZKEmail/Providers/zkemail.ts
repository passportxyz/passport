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
  type ZkEmailCacheEntry,
} from "../types.js";
import { Proof } from "@zk-email/sdk";
import { AMAZON_SUBJECT_KEYWORDS, UBER_SUBJECT_KEYWORDS } from "../keywords.js";
import { subjectContainsKeyword, extractSubjectFromPublicData } from "../utils/subject.js";
import { normalizeWalletAddress } from "../utils.js";
import { countVerifiedProofs, getRequestedMaxThreshold } from "../utils.js";

function getSubjectFromProof(proof: Proof): string | undefined {
  try {
    const { publicData } = proof.getProofData();
    return extractSubjectFromPublicData(publicData);
  } catch {
    return undefined;
  }
}

/**
 * Extracts the hashed email address from a proof's public data.
 * The hashed email serves as a unique identifier for deduplication.
 * @param proof - The proof object to extract the email from
 * @returns The hashed email address, or undefined if not found
 */
function getHashedEmailFromProof(proof: Proof): string | undefined {
  try {
    const { publicData } = proof.getProofData();
    const hashedEmail = publicData.email_recipient;

    // Handle both string and array formats
    const email = Array.isArray(hashedEmail) ? hashedEmail[0] : hashedEmail;

    return typeof email === "string" && email.trim() ? email.trim() : undefined;
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

type ZkEmailContext = ProviderContext & {
  zkemail?: Partial<Record<ProviderGroup, ZkEmailCacheEntry>>;
};

/**
 * Type guard to validate that a payload has the required structure for ZKEmail verification
 * Note: We can't use a true type predicate (payload is ZKEmailRequestPayload) due to
 * incompatible index signatures between RequestPayload and ZKEmailRequestPayload.
 * Instead, we validate the structure at runtime and cast only after validation.
 * @param payload - The payload to validate
 * @returns True if payload has required address and proofs structure
 */
function hasZKEmailPayloadStructure(payload: RequestPayload): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "address" in payload &&
    typeof payload.address === "string" &&
    "proofs" in payload &&
    typeof payload.proofs === "object" &&
    payload.proofs !== null
  );
}

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
      // Validate payload structure - ensures we have address and proofs object
      if (!hasZKEmailPayloadStructure(payload)) {
        return {
          valid: false,
          errors: ["Invalid payload structure: missing required fields (address or proofs)"],
          record,
        };
      }

      const zkEmailPayload = payload as ZKEmailRequestPayload;

      // Get the appropriate proof type for this provider
      const proofType = this.getProofType();
      const proofsField = PROOF_FIELD_MAP[proofType];

      // Validate proof field exists for this specific provider type
      const proofField = zkEmailPayload.proofs?.[proofsField];
      if (!proofField) {
        return {
          valid: false,
          errors: [`No ${proofType} proofs provided in payload`],
          record,
        };
      }

      // Validate proof field is a non-empty array
      if (!Array.isArray(proofField) || proofField.length === 0) {
        return {
          valid: false,
          errors: [`Invalid or empty ${proofType} proofs array`],
          record,
        };
      }

      // Per-request cache keyed by group (amazon/uber) to avoid re-verifying across variants
      context.zkemail = context.zkemail || {};
      const cached = context.zkemail[proofType as ProviderGroup];

      const { initZkEmailSdk } = await import("@zk-email/sdk");
      const sdk = initZkEmailSdk();

      // Type is now safely narrowed to string[]
      const proofs = proofField;

      // Normalize the requesting wallet once
      const normalizedRequestWallet = normalizeWalletAddress(zkEmailPayload.address);

      // Unpack proofs and validate wallet binding + email presence
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

            // Validate that email exists in the proof
            const hashedEmail = getHashedEmailFromProof(proof);
            if (!hashedEmail) {
              throw new Error("Proof missing email_recipient in public data");
            }

            return proof;
          })
        ));

      // Validate that all proofs come from the same email account
      // This prevents mixing proofs from different email accounts to inflate counts
      const firstHashedEmail = getHashedEmailFromProof(unpackedProofs[0]);
      const allSameEmail = unpackedProofs.every((proof) => getHashedEmailFromProof(proof) === firstHashedEmail);

      if (!allSameEmail) {
        return {
          valid: false,
          errors: ["All proofs must be from the same email account"],
          record,
        };
      }

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

      // Get the hashed email - extract on-demand from cached or current proofs
      const hashedEmailForRecord = cached ? getHashedEmailFromProof(cached.unpackedProofs[0]) : firstHashedEmail;

      return {
        valid: true,
        errors,
        record: {
          hashedEmail: hashedEmailForRecord,
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
