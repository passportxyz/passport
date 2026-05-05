import { initHumanID, CredentialType, SignProtocolAttestation } from "@holonym-foundation/human-id-sdk";
import type {
  RequestSBTExtraParams,
  TransactionRequestWithChainId,
  KycOptions,
  CleanHandsOptions,
  PaymentConfig,
} from "@holonym-foundation/human-id-interface-core";
import type { Address } from "viem";
import axios from "axios";
import { ProviderPayload } from "../../types.js";
import { ExtendedHumanIDProvider } from "./types.js";

// Free ZK Passport off-chain attestations live in id-server, keyed by wallet address,
// with a 7-day lifetime. There is no SDK helper yet, so we hit id-server directly.
// Production-only host; sandbox is intentionally not wired here.
const ID_SERVER_BASE_URL = "https://id-server.holonym.io";

export type ZkPassportOffChainAttestation = {
  address: string;
  attestationType: "zk-passport";
  payload: { uniqueIdentifier: string };
  issuedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp; issuedAt + 7 days
};

export function isHexString(value: string): value is `0x${string}` {
  return value.startsWith("0x");
}

export function isAddress(value: string): value is Address {
  return isHexString(value) && value.length === 42;
}

export function validateSbt(
  sbt: { expiry: bigint; publicValues: bigint[]; revoked: boolean } | null
): { valid: true } | { valid: false; error: string } {
  if (!sbt) {
    return { valid: false, error: "SBT not found" };
  }

  // Check publicValues exist and have enough elements (nullifier is at index 3)
  if (!sbt.publicValues || !Array.isArray(sbt.publicValues) || sbt.publicValues.length < 5) {
    return { valid: false, error: "Invalid SBT public values" };
  }

  // Check expiry (use > not >=)
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  if (sbt.expiry <= currentTime) {
    return { valid: false, error: "SBT has expired" };
  }

  // Check revocation
  if (sbt.revoked) {
    return { valid: false, error: "SBT has been revoked" };
  }

  return { valid: true };
}

/**
 * Fetch the most recent free ZK Passport off-chain attestation for an address from id-server.
 * Returns null when no attestation exists (HTTP 404). Throws on other non-2xx responses or
 * malformed payloads — callers should not silently swallow those.
 *
 * Note: id-server returns the most recent attestation regardless of expiry. Callers must
 * check `expiresAt > now` themselves (see validateOffChainAttestation).
 */
export async function getZkPassportFreeOffChainAttestation(
  address: string
): Promise<ZkPassportOffChainAttestation | null> {
  const url = `${ID_SERVER_BASE_URL}/off-chain-attestations/zk-passport`;

  let response;
  try {
    response = await axios.get(url, {
      params: { address },
      timeout: 10_000,
      // We handle 404 ourselves; let axios throw on 5xx and other errors.
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
  } catch (e) {
    throw new Error(`Failed to fetch ZK Passport off-chain attestation: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (response.status === 404) return null;

  const data = response.data;
  if (
    !data ||
    typeof data !== "object" ||
    typeof data.address !== "string" ||
    data.attestationType !== "zk-passport" ||
    typeof data.expiresAt !== "string" ||
    typeof data.payload !== "object" ||
    data.payload === null ||
    typeof data.payload.uniqueIdentifier !== "string"
  ) {
    throw new Error("Malformed ZK Passport off-chain attestation response");
  }

  return data as ZkPassportOffChainAttestation;
}

export function validateOffChainAttestation(
  attestation: ZkPassportOffChainAttestation | null
): { valid: true; expiresAt: Date } | { valid: false; error: string } {
  if (!attestation) {
    return { valid: false, error: "Off-chain attestation not found" };
  }

  if (!attestation.payload?.uniqueIdentifier) {
    return { valid: false, error: "Off-chain attestation missing uniqueIdentifier" };
  }

  const expiresAt = new Date(attestation.expiresAt);
  if (isNaN(expiresAt.getTime())) {
    return { valid: false, error: "Off-chain attestation has invalid expiresAt" };
  }

  if (expiresAt <= new Date()) {
    return { valid: false, error: "Off-chain attestation has expired" };
  }

  return { valid: true, expiresAt };
}

export function validateAttestation(
  attestation: SignProtocolAttestation | null
): { valid: true } | { valid: false; error: string } {
  if (!attestation) {
    return { valid: false, error: "Attestation not found" };
  }

  // Check that indexingValue exists (required for valid attestation)
  if (!attestation.indexingValue) {
    return { valid: false, error: "Invalid attestation - missing indexingValue" };
  }

  // Could add more checks here if needed (e.g., validUntil, revoked)

  return { valid: true };
}

export async function requestSBT({
  credentialType,
  address,
  signMessageAsync,
  sendTransactionAsync,
  switchChainAsync,
  hasExistingCredential,
  kycOptions,
  cleanHandsOptions,
  paymentConfig,
}: {
  credentialType: CredentialType;
  address: Address;
  signMessageAsync: ({ message }: { message: string }) => Promise<string>;
  sendTransactionAsync: (variables: {
    to: `0x${string}`;
    value?: bigint;
    data?: `0x${string}`;
    gas?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }) => Promise<`0x${string}`>;
  switchChainAsync: (params: { chainId: number }) => Promise<any>;
  hasExistingCredential?: (address: string) => Promise<boolean>;
  kycOptions?: KycOptions;
  cleanHandsOptions?: CleanHandsOptions;
  paymentConfig?: PaymentConfig;
}): Promise<ProviderPayload> {
  // Check if user already has a valid credential (SBT or attestation)
  if (hasExistingCredential && (await hasExistingCredential(address))) {
    // Skip all this, just do the backend check
    return {};
  }

  // Note: Cast to any first then to ExtendedHumanIDProvider because the secret methods
  // aren't part of the public interface but exist at runtime
  const humanID = initHumanID() as any as ExtendedHumanIDProvider;

  // Get message to sign
  const message = humanID.getKeygenMessage();

  // Request signature from user
  const signature = await signMessageAsync({ message });

  // Prepare SBT request parameters. kycOptions / cleanHandsOptions / paymentConfig
  // forward to privateRequestSBT — the iframe shows the corresponding card variants.
  const requestParams: RequestSBTExtraParams & {
    kycOptions?: KycOptions;
    cleanHandsOptions?: CleanHandsOptions;
    paymentConfig?: PaymentConfig;
  } = {
    signature,
    address: address,
    kycOptions,
    cleanHandsOptions,
    paymentConfig,
    paymentCallback: async (tx: TransactionRequestWithChainId) => {
      const chainId = parseInt(tx.chainId, 16);

      // Switch to the correct chain if needed
      await switchChainAsync?.({ chainId });

      // Send the transaction
      const txHash = await sendTransactionAsync?.({
        to: tx.to,
        value: BigInt(tx.value ?? "0x0"),
        data: tx.data,
      });

      if (!isHexString(txHash)) {
        throw new Error(`Transaction hash (${txHash}) is not a valid hex string`);
      }

      return {
        txHash,
        chainId,
      };
    },
  };

  // Request SBT
  const result = await humanID.privateRequestSBT(credentialType, requestParams);

  // Extract result data
  const sbtData = result && typeof result === "object" && "sbt" in result ? result.sbt : null;
  const recipient =
    sbtData && typeof sbtData === "object" && "recipient" in sbtData ? String(sbtData.recipient) : undefined;
  const txHash = sbtData && typeof sbtData === "object" && "txHash" in sbtData ? String(sbtData.txHash) : undefined;

  return {
    humanId: {
      sbtRecipient: recipient,
      transactionHash: txHash,
      sbtType: credentialType,
    },
  };
}
