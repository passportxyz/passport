import { initHumanID, CredentialType, SignProtocolAttestation } from "@holonym-foundation/human-id-sdk";
import type { RequestSBTExtraParams, TransactionRequestWithChainId } from "@holonym-foundation/human-id-interface-core";
import type { Address } from "viem";
import { ProviderPayload } from "../../types.js";
import { ExtendedHumanIDProvider } from "./types.js";

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

  // Prepare SBT request parameters
  const requestParams: RequestSBTExtraParams = {
    signature,
    address: address,
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
