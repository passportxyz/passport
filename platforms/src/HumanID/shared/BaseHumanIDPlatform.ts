import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../../types.js";
import { Platform } from "../../utils/platform.js";
import {
  initHumanID,
  CredentialType,
  setOptimismRpcUrl,
  HubV3SBT,
  SignProtocolAttestation,
} from "@holonym-foundation/human-id-sdk";
import type { RequestSBTExtraParams, TransactionRequestWithChainId } from "@holonym-foundation/human-id-interface-core";
import { isHexString, validateSbt, validateAttestation } from "./utils.js";

type RequestSBTResponse = null | {
  sbt: {
    recipient: string;
    txHash: string;
    chain: "Optimism" | "NEAR" | "Stellar";
  };
};

// Define the base interface locally since we can't import it directly
interface HumanIDProviderInterface {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): any;
  removeListener(event: string, listener: (...args: any[]) => void): any;
  requestSBT(type: CredentialType, args: RequestSBTExtraParams): Promise<unknown>;
}

// Extended interface with secret methods that exist at runtime but aren't in the public interface
export interface ExtendedHumanIDProvider extends HumanIDProviderInterface {
  getKeygenMessage(): string;
  privateRequestSBT(type: CredentialType, args: RequestSBTExtraParams): Promise<RequestSBTResponse>;
}

export abstract class BaseHumanIDPlatform extends Platform {
  abstract credentialType: CredentialType;

  // Platforms must implement EITHER sbtFetcher OR attestationFetcher
  sbtFetcher?: (address: string) => Promise<HubV3SBT | null>;
  attestationFetcher?: (address: string) => Promise<SignProtocolAttestation | null>;

  isEVM = true;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async credentialChecker(address: string): Promise<boolean> {
    if (!isHexString(address)) return false;

    // SBT path (KYC, Phone, Biometrics)
    if (this.sbtFetcher) {
      try {
        const sbt = await this.sbtFetcher(address);
        const result = validateSbt(sbt);
        return result.valid;
      } catch {
        return false;
      }
    }

    // Attestation path (CleanHands)
    if (this.attestationFetcher) {
      try {
        const attestation = await this.attestationFetcher(address);
        const result = validateAttestation(attestation);
        return result.valid;
      } catch {
        return false;
      }
    }

    throw new Error("Platform must define either sbtFetcher or attestationFetcher");
  }

  private async hasExistingCredential(address: string): Promise<boolean> {
    const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL;
    if (!rpcUrl) {
      console.warn("Optimism RPC URL not configured for frontend credential check");
      return false;
    }

    setOptimismRpcUrl(rpcUrl);

    return this.credentialChecker(address);
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    // Require wallet methods for Human ID verification (SBT-based platforms)
    if (!appContext.signMessageAsync || !appContext.sendTransactionAsync || !appContext.address) {
      throw new Error("Human ID verification requires wallet connection and signing capabilities");
    }

    // Check if user already has a valid credential (SBT or attestation)
    if (await this.hasExistingCredential(appContext.address)) {
      // Skip all this, just do the backend check
      return {};
    }

    // Note: Cast to any first then to ExtendedHumanIDProvider because the secret methods
    // aren't part of the public interface but exist at runtime
    const humanID = initHumanID() as any as ExtendedHumanIDProvider;

    // Get message to sign
    const message = humanID.getKeygenMessage();

    // Request signature from user
    const signature = await appContext.signMessageAsync({ message });

    // Prepare SBT request parameters
    const requestParams: RequestSBTExtraParams = {
      signature,
      address: appContext.address,
      paymentCallback: async (tx: TransactionRequestWithChainId) => {
        const chainId = parseInt(tx.chainId, 16);

        // Switch to the correct chain if needed
        await appContext.switchChainAsync?.({ chainId });

        // Send the transaction
        const txHash = await appContext.sendTransactionAsync?.({
          to: tx.to,
          value: BigInt(tx.value ?? "0x0"),
          data: tx.data,
        });

        if (!isHexString(txHash)) {
          throw new Error("Transaction hash is not a valid hex string");
        }

        return {
          txHash,
          chainId,
        };
      },
    };

    // Request SBT
    const result = await humanID.privateRequestSBT(this.credentialType, requestParams);

    // Extract result data
    const sbtData = result && typeof result === "object" && "sbt" in result ? result.sbt : null;
    const recipient =
      sbtData && typeof sbtData === "object" && "recipient" in sbtData ? String(sbtData.recipient) : undefined;
    const txHash = sbtData && typeof sbtData === "object" && "txHash" in sbtData ? String(sbtData.txHash) : undefined;

    return {
      humanId: {
        sbtRecipient: recipient,
        transactionHash: txHash,
        sbtType: this.credentialType,
      },
    };
  }
}
