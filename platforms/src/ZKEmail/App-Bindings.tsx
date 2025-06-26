/* eslint-disable no-console */
import React from "react";
import { AppContext, PlatformBanner, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
// Defer SDK import to avoid build-time slowness
// import { initZkEmailSdk, Gmail, LoginWithGoogle, Proof } from "@zk-email/sdk";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";

  // loginWithGoogle: LoginWithGoogle;
  private uberProofs: string[] = [];

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
    const blueprint = await sdk.getBlueprintById("4cfc3efd-7215-4e96-9b4e-291d2a9cc702");
    console.log("blueprint app bindings: ", blueprint);

    // fetch emails
    const emailResponses = await gmail.fetchEmails([blueprint], {
      replaceQuery: "from:amazon.de \"Delivered: Your Amazon.de order\"",
    });
    // const emailResponses = await gmail.fetchEmails([blueprint]);
    console.log("Email responses: ", emailResponses);

    const moreEmails = await gmail.fetchMore();
    console.log("More emails: ", moreEmails);

    const moreMoreEmails = await gmail.fetchMore();
    console.log("More more emails: ", moreMoreEmails);

    const moreMoreMoreEmails = await gmail.fetchMore();
    console.log("More more more emails: ", moreMoreMoreEmails);

    emailResponses.push(...moreEmails, ...moreMoreEmails, ...moreMoreMoreEmails);

    console.log("Email responses: ", emailResponses);

    // validate emails
    const validatedEmails = await Promise.all(
      emailResponses.map(async (rawEmail) => {
        try {
          await blueprint.validateEmail(rawEmail.decodedContents);
          return rawEmail;
        } catch (err: unknown) {
          console.log("Error validating email: ", err);
          return undefined;
        }
      })
    );

    const filteredEmails = validatedEmails.filter((email) => email !== undefined);

    console.log("Filtered emails: ", filteredEmails);

    const prover = blueprint.createProver();

    // for validated emails, generate proofs
    const proofs = await Promise.all(
      filteredEmails.map(async (email) => {
        const proof = await prover.generateProof(email.decodedContents);
        return proof;
      })
    );
    console.log("Proofs: ", proofs);

    this.uberProofs = proofs.map(p => p.packProof());

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
      validEmails: this.uberProofs.length.toString(),
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
