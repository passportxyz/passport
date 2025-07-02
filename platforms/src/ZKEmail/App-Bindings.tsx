import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import { AMAZON_GROUP, UBER_GROUP } from "./types.js";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";

  private zkEmailSdk: typeof import("@zk-email/sdk") | null = null;

  private uberProofs: string[] = [];
  private amazonProofs: string[] = [];

  constructor(options: PlatformOptions = {}) {
    super();
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

    const sdk = initZkEmailSdk({});

    const amazonGroup = await sdk.getBlueprintGroupById(AMAZON_GROUP);
    const amazonBlueprints = await amazonGroup.fetchBlueptrints();

    const uberGroup = await sdk.getBlueprintGroupById(UBER_GROUP);
    const uberBlueprints = await uberGroup.fetchBlueptrints();

    // fetch uber emails
    const uberEmailResponses = await gmail.fetchEmails(uberBlueprints);
    let moreUberEmails = await gmail.fetchMore();
    while (moreUberEmails.length > 0) {
      uberEmailResponses.push(...moreUberEmails);
      moreUberEmails = await gmail.fetchMore();
    }
    const filteredUberEmails = uberEmailResponses.filter((email) =>
      uberBlueprints.some((blueprint) => email.decodedContents.includes(blueprint.props.senderDomain))
    );

    // fetch amazon emails
    const amazonEmailResponses = await gmail.fetchEmails(amazonBlueprints);
    let moreAmazonEmails = await gmail.fetchMore();
    while (moreAmazonEmails.length > 0) {
      amazonEmailResponses.push(...moreAmazonEmails);
      moreAmazonEmails = await gmail.fetchMore();
    }
    const filteredAmazonEmails = amazonEmailResponses.filter((email) =>
      amazonBlueprints.some((blueprint) => email.decodedContents.includes(blueprint.props.senderDomain))
    );

    // validate uber emails and proof valid emails
    const uberProofs = await Promise.all(
      filteredUberEmails.map(async (rawEmail) => {
        try {
          const uberBlueprint = uberBlueprints.find((blueprint) =>
            rawEmail.decodedContents.includes(blueprint.props.senderDomain)
          );
          if (!uberBlueprint) {
            return undefined;
          }
          await uberBlueprint.validateEmail(rawEmail.decodedContents);
          const proof = await uberBlueprint.createProver().generateProof(rawEmail.decodedContents);
          return proof;
        } catch (err: unknown) {
          return undefined;
        }
      })
    );

    // validate amazon emails and proof valid emails
    const amazonProofs = await Promise.all(
      filteredAmazonEmails.map(async (rawEmail) => {
        try {
          const amazonBlueprint = amazonBlueprints.find((blueprint) =>
            rawEmail.decodedContents.includes(blueprint.props.senderDomain)
          );
          if (!amazonBlueprint) {
            return undefined;
          }
          await amazonBlueprint.validateEmail(rawEmail.decodedContents);
          const proof = await amazonBlueprint.createProver().generateProof(rawEmail.decodedContents);
          return proof;
        } catch (err: unknown) {
          return undefined;
        }
      })
    );

    this.uberProofs = uberProofs.filter((p) => p !== undefined).map((p) => p.packProof());
    this.amazonProofs = amazonProofs.filter((p) => p !== undefined).map((p) => p.packProof());
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
