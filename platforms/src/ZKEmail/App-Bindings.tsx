/* eslint-disable no-console */
import React from "react";
import { AppContext, PlatformBanner, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
// Defer SDK import to avoid build-time slowness
// import { initZkEmailSdk, Gmail, LoginWithGoogle, Proof } from "@zk-email/sdk";

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
    // Dynamic import to avoid build-time slowness
    const { initZkEmailSdk, Gmail, LoginWithGoogle } = await import("@zk-email/sdk");

    const loginWithGoogle = new LoginWithGoogle();
    const gmail = new Gmail(loginWithGoogle);
    if (!loginWithGoogle.accessToken) {
      void loginWithGoogle.authorize({});
    }

    const sdk = initZkEmailSdk({});
    const uberBlueprint = await sdk.getBlueprintById("f9de1c4a-b90c-47af-941f-d21a0ecf1411");
    const amazonBlueprint = await sdk.getBlueprintById("da877bd1-b8f8-48c2-a36c-c71f73f9dbb9");
    console.log("uber blueprint app bindings: ", uberBlueprint);

    // fetch emails
    const uberEmailResponses = await gmail.fetchEmails([uberBlueprint], {
      replaceQuery: "from:uber.com",
    });
    let moreUberEmails = await gmail.fetchMore();
    while (moreUberEmails.length > 0) {
      uberEmailResponses.push(...moreUberEmails);
      moreUberEmails = await gmail.fetchMore();
    }
    const filteredUberEmails = uberEmailResponses.filter((email) =>
      email.decodedContents.includes(uberBlueprint.props.senderDomain)
    );

    const amazonEmailResponses = await gmail.fetchEmails([amazonBlueprint], {
      replaceQuery: "from:amazon.com",
    });
    let moreAmazonEmails = await gmail.fetchMore();
    while (moreAmazonEmails.length > 0) {
      amazonEmailResponses.push(...moreAmazonEmails);
      moreAmazonEmails = await gmail.fetchMore();
    }
    const filteredAmazonEmails = amazonEmailResponses.filter((email) =>
      email.decodedContents.includes(amazonBlueprint.props.senderDomain)
    );

    // console.log("Email responses: ", emailResponses);

    // validate emails and proof valid emails
    const uberProofs = await Promise.all(
      filteredUberEmails.map(async (rawEmail) => {
        try {
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
          await amazonBlueprint.validateEmail(rawEmail.decodedContents);
          const proof = await amazonBlueprint.createProver().generateProof(rawEmail.decodedContents);
          return proof;
        } catch (err: unknown) {
          console.log("Error validating email: ", err);
          return undefined;
        }
      })
    );

    // const filteredEmails = validatedEmails.filter((email) => email !== undefined);

    // const prover = blueprint.createProver();

    // // for validated emails, generate proofs
    // const proofs = await Promise.all(
    //   filteredEmails.map(async (email) => {
    //     const proof = await prover.generateProof(email.decodedContents);
    //     return proof;
    //   })
    // );
    console.log("Uber proofs: ", uberProofs);
    console.log("Amazon proofs: ", amazonProofs);

    this.uberProofs = uberProofs.filter((p) => p !== undefined).map((p) => p.packProof());
    this.amazonProofs = amazonProofs.filter((p) => p !== undefined).map((p) => p.packProof());

    // const verified = await blueprint.verifyProof(proofs[0]);

    // const packedProof = proofs[0].packProof();
    // try {
    //   const verified = await proofs[0].verify();
    //   console.log("Verified: ", verified);
    // } catch(err){
    //   console.error("failed to verify err: ", err);
    // }
    // const verified = await blueprint.verifyProofData(publicData.toString(), proofData);

    // send proofs to the server
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

  // getOAuthUrl(state: string): Promise<string> {
  //   return new Promise((resolve) => {
  //     resolve(
  //       `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${this.redirectUri}&prompt=consent&response_type=code&client_id=${this.clientId}&scope=email+profile+https://www.googleapis.com/auth/gmail.readonly&access_type=offline&state=${state}`
  //     );
  //   });
  // }
}
