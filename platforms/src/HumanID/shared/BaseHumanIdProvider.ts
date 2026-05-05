import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions, ProviderInternalVerificationError } from "../../types.js";
import { setOptimismRpcUrl, HubV3SBT } from "@holonym-foundation/human-id-sdk";
import { validateSbt, isAddress } from "./utils.js";

/**
 * A credential source produces a per-source verification result. The provider's
 * verify() iterates sources in order and returns the first valid result, otherwise
 * an aggregated failure.
 *
 * `expiresInSeconds` (when set) flows through to the issued VC's `expirationDate`
 * via identity/src/verification.ts and identity/src/credentials.ts. SBT-based
 * sources omit it (they get the default credential expiry); off-chain attestation
 * sources set it to the remaining attestation lifetime.
 */
export type CredentialSourceResult =
  | { valid: true; record: Record<string, string>; expiresInSeconds?: number }
  | { valid: false; error: string };

export type CredentialSource = (address: string) => Promise<CredentialSourceResult>;

/** Build a CredentialSource from an SBT fetcher. Errors and missing SBTs are reported as failures. */
export function sbtSource(
  fetcher: (address: string) => Promise<HubV3SBT | null>,
  recordExtras: Record<string, string> = {}
): CredentialSource {
  return async (address: string): Promise<CredentialSourceResult> => {
    let sbt: HubV3SBT | null;
    try {
      sbt = await fetcher(address);
    } catch (e) {
      // SDK throws when the SBT is not found; treat as a missing credential, not a hard error.
      return { valid: false, error: e instanceof Error ? e.message : "SBT lookup failed" };
    }

    const result = validateSbt(sbt);
    if (!result.valid) return { valid: false, error: (result as any).error };

    return {
      valid: true,
      record: {
        // Public Values: [expiry, recipientAddress, actionId, nullifier, issuerAddress]
        nullifier: sbt?.publicValues?.[3]?.toString() ?? "",
        ...recordExtras,
      },
    };
  };
}

export abstract class BaseHumanIdProvider implements Provider {
  abstract type: string;
  abstract credentialType: string;

  // Single-source subclasses (Phone, Biometrics) define `sbtFetcher`. Multi-source
  // subclasses (Government ID) override `sources()` to return an ordered list.
  sbtFetcher?: (address: string) => Promise<HubV3SBT | null>;

  constructor(_options: ProviderOptions = {}) {}

  /**
   * Override to provide a custom ordered list of credential sources. Default
   * implementation wraps the single `sbtFetcher` for backward compatibility.
   */
  protected sources(): CredentialSource[] {
    if (!this.sbtFetcher) {
      throw new ProviderInternalVerificationError("Provider must define sbtFetcher or override sources()");
    }
    return [sbtSource(this.sbtFetcher)];
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const rpcUrl = process.env.OPTIMISM_RPC_URL;
    if (!rpcUrl) {
      throw new ProviderInternalVerificationError("Optimism RPC URL not configured");
    }
    setOptimismRpcUrl(rpcUrl);

    if (!isAddress(payload.address)) {
      throw new ProviderInternalVerificationError("Invalid address format");
    }

    const sources = this.sources();
    const errors: string[] = [];
    for (const source of sources) {
      const result = await source(payload.address);
      if (result.valid) {
        return {
          valid: true,
          record: result.record,
          expiresInSeconds: result.expiresInSeconds,
        };
      }
      // After the early return above, TS narrowing keeps `result.valid === false` here.
      errors.push((result as { valid: false; error: string }).error);
    }

    return {
      valid: false,
      errors: [`${this.credentialType} ${errors.join("; ")}`],
      record: {},
    };
  }
}
