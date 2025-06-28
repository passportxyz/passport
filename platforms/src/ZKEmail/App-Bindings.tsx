/* eslint-disable no-console */
import React from "react";
import { AppContext, PlatformBanner, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";

  private uberProofs: string[] = [];
  private amazonProofs: string[] = [];

  constructor(options: PlatformOptions = {}) {
    super();
    this.banner = {
      heading: "To add the ZKEmail Stamp to your Passport...",
      content: (
        <div>
          <p>To add the ZKEmail Stamp to your Passport, you need to login with Google and prove your Uber trips.</p>
          <p>Click "Connect Account" below to start the verification process.</p>
        </div>
      ),
      cta: {
        label: "Learn more",
        url: "",
      },
    };
  }

  async handleLoginAndProve(): Promise<void> {
    // TODO: we will get this dynamically from the sdk
    const UBER_BLUEPRINTS = ["94f5ba10-2670-4b5c-9e91-56f06246d176", "f9de1c4a-b90c-47af-941f-d21a0ecf1411"];
    const AMAZON_BLUEPRINTS = [
      "07d83b53-67ce-48b7-96c1-07d26cd3cdef",
      "b28b7734-e57b-4e3d-8044-0da1e20f782f",
      "5d0cee90-7805-4052-8eb9-6c71bc969806",
    ];

    // Dynamic import to avoid build-time slowness
    const { initZkEmailSdk, Gmail, LoginWithGoogle } = await import("@zk-email/sdk");

    const loginWithGoogle = new LoginWithGoogle();
    const gmail = new Gmail(loginWithGoogle);
    if (!loginWithGoogle.accessToken) {
      void loginWithGoogle.authorize({});
    }

    const sdk = initZkEmailSdk({});

    const uberBlueprints = await Promise.all(UBER_BLUEPRINTS.map(async (id) => sdk.getBlueprintById(id)));
    const amazonBlueprints = await Promise.all(AMAZON_BLUEPRINTS.map(async (id) => sdk.getBlueprintById(id)));

    console.log("uber blueprint app bindings: ", uberBlueprints);

    // fetch emails
    const uberEmailResponses = await gmail.fetchEmails(uberBlueprints);
    let moreUberEmails = await gmail.fetchMore();
    while (moreUberEmails.length > 0) {
      uberEmailResponses.push(...moreUberEmails);
      moreUberEmails = await gmail.fetchMore();
    }
    const filteredUberEmails = uberEmailResponses.filter((email) =>
      uberBlueprints.some((blueprint) => email.decodedContents.includes(blueprint.props.senderDomain))
    );

    const amazonEmailResponses = await gmail.fetchEmails(amazonBlueprints);
    let moreAmazonEmails = await gmail.fetchMore();
    while (moreAmazonEmails.length > 0) {
      amazonEmailResponses.push(...moreAmazonEmails);
      moreAmazonEmails = await gmail.fetchMore();
    }
    const filteredAmazonEmails = amazonEmailResponses.filter((email) =>
      amazonBlueprints.some((blueprint) => email.decodedContents.includes(blueprint.props.senderDomain))
    );

    // console.log("Email responses: ", emailResponses);

    // validate emails and proof valid emails
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
          console.log("Error validating email: ", err);
          return undefined;
        }
      })
    );

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
          console.log("Error validating email: ", err);
          return undefined;
        }
      })
    );

    this.uberProofs = uberProofs.filter((p) => p !== undefined).map((p) => p.packProof());
    this.amazonProofs = amazonProofs.filter((p) => p !== undefined).map((p) => p.packProof());

    console.log("Uber proofs: ", this.uberProofs);
    console.log("Amazon proofs: ", this.amazonProofs);
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    // If no proofs generated yet, trigger the login and prove process
    if (this.uberProofs.length === 0) {
      await this.handleLoginAndProve();
    }

    return {
      uberProofs: this.uberProofs,
      amazonProofs: this.amazonProofs,
    };
  }
}
