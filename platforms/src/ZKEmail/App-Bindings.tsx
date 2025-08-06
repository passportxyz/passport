import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import { AMAZON_GROUP, UBER_GROUP } from "./types.js";
import { Blueprint, Gmail, Proof } from "@zk-email/sdk";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";
  clientId: string = null;

  private zkEmailSdk: typeof import("@zk-email/sdk") | null = null;

  private uberProofs: string[] = [];
  private amazonProofs: string[] = [];

  constructor(options: PlatformOptions = {}) {
    super();
    // No banner needed - all guidance is now in the structured guide
    this.clientId = options.clientId as string;

  }

  private async fetchAndProveEmails(gmail: Gmail, blueprints: Blueprint[]): Promise<string[]> {
    try {
      // Add null check for blueprints
      if (!blueprints || blueprints.length === 0) {
        return [];
      }

      const emailResponses = await gmail.fetchEmails(blueprints);

      // Add null check and ensure emailResponses is an array
      if (!emailResponses || !Array.isArray(emailResponses)) {
        return [];
      }

      // Safely fetch additional emails
      try {
        let moreEmails = await gmail.fetchMore();
        while (moreEmails && Array.isArray(moreEmails) && moreEmails.length > 0) {
          emailResponses.push(...moreEmails);
          moreEmails = await gmail.fetchMore();
        }
      } catch {
        // Continue with the emails we have if fetchMore fails
      }

      const filteredEmails = emailResponses.filter((email) =>
        blueprints.some((blueprint) => email.decodedContents.includes(blueprint.props.senderDomain))
      );

      const proofs = await Promise.all(
        filteredEmails.map(async (rawEmail) => {
          try {
            const blueprint = blueprints.find((blueprint) =>
              rawEmail.decodedContents.includes(blueprint.props.senderDomain)
            );
            if (!blueprint) {
              return undefined;
            }
            await blueprint.validateEmail(rawEmail.decodedContents);
            const proof = await blueprint.createProver().generateProof(rawEmail.decodedContents);
            return proof;
          } catch {
            // Silently skip failed proof generations
            return undefined;
          }
        })
      );

      return proofs.filter((p) => p !== undefined).map((p: Proof) => p.packProof());
    } catch {
      // Return empty array if entire operation fails
      return [];
    }
  }

  private async getZkEmailSdk(): Promise<typeof import("@zk-email/sdk")> {
    if (!this.zkEmailSdk) {
      // Dynamic import to avoid build-time slowness
      this.zkEmailSdk = await import("@zk-email/sdk");
    }
    return this.zkEmailSdk;
  }

  async handleLoginAndProve(): Promise<void> {
    const { initZkEmailSdk, Gmail, LoginWithGoogle } = await this.getZkEmailSdk();

    const loginWithGoogle = new LoginWithGoogle({ clientId: this.clientId });

    const gmail = new Gmail(loginWithGoogle);
    if (!loginWithGoogle.accessToken) {
      await loginWithGoogle.authorize({
        prompt: "consent",
        access_type: "online",
      });
    }

    const sdk = initZkEmailSdk({ logging: { enabled: true, level: "debug" } });

    // Process Amazon emails with graceful error handling
    try {
      const amazonGroup = await sdk.getBlueprintGroupById(AMAZON_GROUP);
      const amazonBlueprints = await amazonGroup.fetchBlueptrints();
      this.amazonProofs = await this.fetchAndProveEmails(gmail, amazonBlueprints);
    } catch {
      // Silently fail and continue with empty Amazon proofs
      this.amazonProofs = [];
    }

    // Process Uber emails with graceful error handling
    try {
      const uberGroup = await sdk.getBlueprintGroupById(UBER_GROUP);
      const uberBlueprints = await uberGroup.fetchBlueptrints();
      this.uberProofs = await this.fetchAndProveEmails(gmail, uberBlueprints);
    } catch {
      // Silently fail and continue with empty Uber proofs
      this.uberProofs = [];
    }
  }

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    if (this.uberProofs.length === 0 && this.amazonProofs.length === 0) {
      await this.handleLoginAndProve();
    }

    return {
      uberProofs: this.uberProofs,
      amazonProofs: this.amazonProofs,
    };
  }
}
