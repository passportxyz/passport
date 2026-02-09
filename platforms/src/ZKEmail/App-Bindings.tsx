import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import { AMAZON_GROUP, ProviderGroup, UBER_GROUP } from "./types.js";
import { shouldContinueFetchingEmails, normalizeWalletAddress } from "./utils.js";
import { Blueprint, Gmail, Proof, RawEmailResponse, FetchEmailOptions } from "@zk-email/sdk";
import { buildCombinedQuery } from "./utils/queryBuilder.js";
import { AMAZON_SUBJECT_KEYWORDS, UBER_SUBJECT_KEYWORDS } from "./keywords.js";

const DKIM_HEADER_REGEX = /^DKIM-Signature:\s*(.+?)(?=\r?\n[^ \t])/gims;

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";
  clientId: string | null = null;

  private zkEmailSdk: typeof import("@zk-email/sdk") | null = null;

  private uberProofs: string[] = [];
  private amazonProofs: string[] = [];
  private authPromise: Promise<void> | null = null;

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
    walletAddress: string
  ): Promise<string[]> {
    // Extract DKIM sender domain once per email (outside blueprint loop)
    const emailsWithDomain = emails.map((email) => {
      const emailDkimHeader = email.decodedContents.match(DKIM_HEADER_REGEX);
      const senderDomain = emailDkimHeader?.[0]?.match(/d=([^;]+)/)?.[1] || "";
      return { email, senderDomain };
    });

    // Build blueprint lookup map for O(1) access by sender domain
    const blueprintMap = new Map(blueprints.map((bp) => [bp.props.senderDomain, bp]));

    // Process emails using pre-extracted sender domains
    const proofPromises = emailsWithDomain.map(async ({ email, senderDomain }) => {
      const blueprint = blueprintMap.get(senderDomain);

      if (!blueprint) {
        return undefined;
      }

      try {
        await blueprint.validateEmail(email.decodedContents);
        const proof = await blueprint
          .createProver()
          .generateProof(email.decodedContents, [{ name: "wallet_address", value: walletAddress }]);
        return proof;
      } catch {
        // Silently skip failed proof generations
        return undefined;
      }
    });

    const proofs = await Promise.all(proofPromises);
    return proofs.filter((p) => p !== undefined).map((p: Proof) => p.packProof());
  }

  private async fetchAndProveEmails(
    gmail: Gmail,
    blueprints: Blueprint[],
    group: "amazon" | "uber",
    walletAddress: string
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

      // Start processing the initial batch immediately
      const initialProofsPromise = this.processEmailBatch(initialEmails, blueprints, walletAddress);

      // Concurrently fetch and process additional emails
      const additionalProofsPromise = this.fetchAndProcessAdditionalEmails(gmail, blueprints, group, walletAddress);

      // Wait for both to complete and combine results
      const [initialProofs, additionalProofs] = await Promise.all([initialProofsPromise, additionalProofsPromise]);

      return [...initialProofs, ...additionalProofs];
    } catch {
      // Return empty array if entire operation fails
      return [];
    }
  }

  private async fetchAndProcessAdditionalEmails(
    gmail: Gmail,
    blueprints: Blueprint[],
    group: ProviderGroup,
    walletAddress: string
  ): Promise<string[]> {
    try {
      let moreEmails = await gmail.fetchMore();
      const processingPromises: Promise<string[]>[] = [];
      let currentProofCount = 0;

      while (shouldContinueFetchingEmails(moreEmails, currentProofCount, group)) {
        // Start processing this batch while fetching the next one
        const batchPromise = this.processEmailBatch(moreEmails, blueprints, walletAddress);
        processingPromises.push(batchPromise);

        // Update count based on current batch size for early exit
        currentProofCount += moreEmails.length;

        // Fetch next batch
        moreEmails = await gmail.fetchMore();
      }

      // Wait for all processing to complete and flatten results
      const allBatchProofs = await Promise.all(processingPromises);
      return allBatchProofs.flat();
    } catch {
      // Return empty array if fetchMore fails
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

  async handleLoginAndProve(appContext: AppContext): Promise<void> {
    const { initZkEmailSdk, Gmail, LoginWithGoogle } = await this.getZkEmailSdk();

    // Get and validate wallet address
    if (!appContext.address) {
      throw new Error("Wallet address is required for ZKEmail verification");
    }
    const walletAddress = normalizeWalletAddress(appContext.address);

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
      this.amazonProofs = await this.fetchAndProveEmails(gmail, amazonBlueprints, "amazon", walletAddress);
    } catch {
      // Silently fail and continue with empty Amazon proofs
      this.amazonProofs = [];
    }

    // Process Uber emails with graceful error handling
    try {
      const uberGroup = await sdk.getBlueprintGroupById(UBER_GROUP);
      const uberBlueprints = await uberGroup.fetchBlueptrints();
      this.uberProofs = await this.fetchAndProveEmails(gmail, uberBlueprints, "uber", walletAddress);
    } catch {
      // Silently fail and continue with empty Uber proofs
      this.uberProofs = [];
    }
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    if (this.uberProofs.length === 0 && this.amazonProofs.length === 0) {
      if (!this.authPromise) {
        this.authPromise = this.handleLoginAndProve(appContext);
      }
      await this.authPromise;
    }

    return {
      uberProofs: this.uberProofs,
      amazonProofs: this.amazonProofs,
    };
  }
}
