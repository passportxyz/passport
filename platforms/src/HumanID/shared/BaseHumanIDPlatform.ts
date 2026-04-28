import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../../types.js";
import { Platform } from "../../utils/platform.js";
import { CredentialType, setOptimismRpcUrl, HubV3SBT, SignProtocolAttestation } from "@holonym-foundation/human-id-sdk";
import type { KycOptions, CleanHandsOptions } from "@holonym-foundation/human-id-interface-core";
import { isAddress, validateSbt, validateAttestation, requestSBT } from "./utils.js";

export abstract class BaseHumanIDPlatform extends Platform {
  abstract credentialType: CredentialType;

  // Platforms must implement EITHER sbtFetcher (or sbtFetchers) OR attestationFetcher
  sbtFetcher?: (address: string) => Promise<HubV3SBT | null>;
  // Optional ordered list of SBT fetchers — first valid SBT wins. Used by platforms
  // (e.g. Government ID) whose credential can come from multiple Human ID issuance paths.
  sbtFetchers?: ReadonlyArray<(address: string) => Promise<HubV3SBT | null>>;
  attestationFetcher?: (address: string) => Promise<SignProtocolAttestation | null>;
  // Optional check for an off-chain attestation (e.g. free ZK Passport, 7-day TTL).
  // Returns truthy when a valid attestation exists for the address.
  hasValidOffChainAttestation?: (address: string) => Promise<boolean>;

  // Forwarded to privateRequestSBT so the iframe shows the matching card variants.
  kycOptions?: KycOptions;
  cleanHandsOptions?: CleanHandsOptions;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async credentialChecker(address: string): Promise<boolean> {
    if (!isAddress(address)) return false;

    // SBT path — try every configured SBT fetcher (KYC, Phone, Biometrics, ZK Passport).
    const sbtFetchers = this.sbtFetchers ?? (this.sbtFetcher ? [this.sbtFetcher] : []);
    for (const fetcher of sbtFetchers) {
      try {
        const sbt = await fetcher(address);
        if (validateSbt(sbt).valid) return true;
      } catch {
        // try next fetcher
      }
    }

    // On-chain attestation path (CleanHands).
    if (this.attestationFetcher) {
      try {
        const attestation = await this.attestationFetcher(address);
        if (validateAttestation(attestation).valid) return true;
      } catch {
        // fall through
      }
    }

    // Off-chain attestation path (e.g. free ZK Passport, 7-day TTL).
    if (this.hasValidOffChainAttestation) {
      try {
        if (await this.hasValidOffChainAttestation(address)) return true;
      } catch {
        // fall through
      }
    }

    if (sbtFetchers.length === 0 && !this.attestationFetcher && !this.hasValidOffChainAttestation) {
      throw new Error("Platform must define an SBT fetcher, an attestation fetcher, or an off-chain attestation check");
    }

    return false;
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
    return requestSBT({
      credentialType: this.credentialType,
      hasExistingCredential: this.hasExistingCredential.bind(this),
      address: appContext.address as `0x${string}`,
      signMessageAsync: appContext.signMessageAsync,
      sendTransactionAsync: appContext.sendTransactionAsync,
      switchChainAsync: appContext.switchChainAsync,
      kycOptions: this.kycOptions,
      cleanHandsOptions: this.cleanHandsOptions,
    });
  }
}
