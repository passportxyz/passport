import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import { AMAZON_GROUP, ProviderGroup, UBER_GROUP } from "./types.js";
import { shouldContinueFetchingEmails } from "./utils.js";
import { Blueprint, Gmail, Proof, RawEmailResponse, FetchEmailOptions } from "@zk-email/sdk";
import { buildCombinedQuery } from "./utils/queryBuilder.js";
import { AMAZON_SUBJECT_KEYWORDS, UBER_SUBJECT_KEYWORDS } from "./keywords.js";

const DKIM_HEADER_REGEX = /^DKIM-Signature:\s*(.+?)(?=\r?\n[^ \t])/gims;

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";
  clientId: string = null;

  private zkEmailSdk: typeof import("@zk-email/sdk") | null = null;

  private uberProofs: string[] = [];
  private amazonProofs: string[] = [];

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.banner = {
      heading: "To add the ZKEmail Stamp to your Passport...",
      content: (
        <div>
          <p>You need to login with Google and prove your Uber trips and/or Amazon purchases.</p>
          <p>Click "Verify" below to start the verification process. Please be patient as this can take some time.</p>
          <br />
          <p>
            If you have some trouble proving your emails, you can contribute to our public archive of dkim keys{" "}
            <a
              style={{ color: "#4abeff" }}
              href="https://archive.zk.email/contribute"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            or contact us at{" "}
            <a style={{ color: "#4abeff" }} href="mailto:support@zk.email" target="_blank" rel="noopener noreferrer">
              support@zk.email
            </a>
            .
          </p>
        </div>
      ),
      // cta: {
      //   label: "Learn more",
      //   url: "",
      // },
    };
  }

  private async processEmailBatch(
    emails: RawEmailResponse[],
    blueprints: Blueprint[],
    processedProofs: string[]
  ): Promise<void> {
    const proofPromises = emails.map(async (email) => {
      // we need to find the correct blueprint for the email based on the sender domain (present in DKIM header)
      const blueprint = blueprints.find((blueprint) => {
        const emailDkimHeader = email.decodedContents.match(DKIM_HEADER_REGEX);
        const emailSenderDomain = emailDkimHeader?.[0]?.match(/d=([^;]+)/)?.[1] || "";

        return emailSenderDomain === blueprint.props.senderDomain;
      });

      if (!blueprint) {
        return undefined;
      }

      try {
        await blueprint.validateEmail(email.decodedContents);
        const proof = await blueprint.createProver().generateProof(email.decodedContents);
        return proof;
      } catch {
        // Silently skip failed proof generations
        return undefined;
      }
    });

    const proofs = await Promise.all(proofPromises);
    const validProofs = proofs.filter((p) => p !== undefined).map((p: Proof) => p.packProof());

    processedProofs.push(...validProofs);
  }

  private async fetchAndProveEmails(
    gmail: Gmail,
    blueprints: Blueprint[],
    group: "amazon" | "uber"
  ): Promise<string[]> {
    try {
      // Add null check for blueprints
      if (!blueprints || blueprints.length === 0) {
        return [];
      }

      // Build subject query based on the group
      const subjectKeywords = group === "amazon" ? AMAZON_SUBJECT_KEYWORDS : UBER_SUBJECT_KEYWORDS;
      // const subjectQuery = buildSubjectQuery(subjectKeywords);
      const subjectQuery = buildCombinedQuery(
        blueprints.map((blueprint) => blueprint.props.emailQuery).join(" OR "),
        subjectKeywords
      );
      const fetchOptions: FetchEmailOptions = subjectQuery ? { replaceQuery: subjectQuery } : {};

      // Fetch initial batch of emails with subject filtering
      const initialEmails = await gmail.fetchEmails(blueprints, fetchOptions);

      // Add null check and ensure emailResponses is an array
      if (!initialEmails || !Array.isArray(initialEmails)) {
        return [];
      }

      // Array to collect all processed proofs
      const allProofs: string[] = [];

      // Start processing the initial batch immediately
      const initialProcessingPromise = this.processEmailBatch(initialEmails, blueprints, allProofs);

      // Concurrently fetch and process additional emails
      const additionalProcessingPromise = this.fetchAndProcessAdditionalEmails(gmail, blueprints, allProofs, group);

      // Wait for both initial processing and additional fetching to complete
      await Promise.all([initialProcessingPromise, additionalProcessingPromise]);

      return allProofs;
    } catch {
      // Return empty array if entire operation fails
      return [];
    }
  }

  private async fetchAndProcessAdditionalEmails(
    gmail: Gmail,
    blueprints: Blueprint[],
    allProofs: string[],
    group: ProviderGroup
  ): Promise<void> {
    try {
      let moreEmails = await gmail.fetchMore();
      const processingPromises: Promise<void>[] = [];

      while (shouldContinueFetchingEmails(moreEmails, allProofs.length, group)) {
        // Start processing this batch while fetching the next one
        processingPromises.push(this.processEmailBatch(moreEmails, blueprints, allProofs));

        // Fetch next batch
        moreEmails = await gmail.fetchMore();
      }

      // Wait for all processing to complete
      await Promise.all(processingPromises);
    } catch {
      // Continue with the emails we have if fetchMore fails
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

    const loginWithGoogle = new LoginWithGoogle();

    const gmail = new Gmail(loginWithGoogle);
    if (!loginWithGoogle.accessToken) {
      await loginWithGoogle.authorize({
        prompt: "consent",
        access_type: "online",
      });
    }

    const sdk = initZkEmailSdk();

    // Process Amazon emails with graceful error handling
    try {
      const amazonGroup = await sdk.getBlueprintGroupById(AMAZON_GROUP);
      const amazonBlueprints = await amazonGroup.fetchBlueptrints();
      this.amazonProofs = await this.fetchAndProveEmails(gmail, amazonBlueprints, "amazon");
    } catch {
      // Silently fail and continue with empty Amazon proofs
      this.amazonProofs = [];
    }

    // Process Uber emails with graceful error handling
    try {
      const uberGroup = await sdk.getBlueprintGroupById(UBER_GROUP);
      const uberBlueprints = await uberGroup.fetchBlueptrints();
      this.uberProofs = await this.fetchAndProveEmails(gmail, uberBlueprints, "uber");
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
