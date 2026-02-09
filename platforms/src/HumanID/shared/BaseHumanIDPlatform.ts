import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../../types.js";
import { Platform } from "../../utils/platform.js";
import { CredentialType, setOptimismRpcUrl, HubV3SBT, SignProtocolAttestation } from "@holonym-foundation/human-id-sdk";
import { isAddress, validateSbt, validateAttestation, requestSBT } from "./utils.js";

export abstract class BaseHumanIDPlatform extends Platform {
  abstract credentialType: CredentialType;

  // Platforms must implement EITHER sbtFetcher OR attestationFetcher
  sbtFetcher?: (address: string) => Promise<HubV3SBT | null>;
  attestationFetcher?: (address: string) => Promise<SignProtocolAttestation | null>;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async credentialChecker(address: string): Promise<boolean> {
    if (!isAddress(address)) return false;

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

  async hasExistingCredential(address: string): Promise<boolean> {
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

    return requestSBT({
      credentialType: this.credentialType,
      hasExistingCredential: this.hasExistingCredential.bind(this),
      address: appContext.address as `0x${string}`,
      signMessageAsync: appContext.signMessageAsync,
      sendTransactionAsync: appContext.sendTransactionAsync,
      switchChainAsync: appContext.switchChainAsync,
    });
  }
}
