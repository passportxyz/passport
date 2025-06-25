/* eslint-disable no-console */
import React from "react";
import { PlatformBanner, PlatformOptions } from "../types.js";
import { Platform } from "../utils/platform.js";
import { initZkEmailSdk, Gmail, LoginWithGoogle } from "@zk-email/sdk";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";

  loginWithGoogle: LoginWithGoogle;

  constructor(options: PlatformOptions = {}) {
    super();
    this.banner = {
      heading: "To add the ZKEmail Stamp to your Passport...",
      content: (
        <div>
          <p>To add the ZKEmail Stamp to your Passport, you need to login with Google.</p>
          <button
            onClick={() => {
              this.handleLoginAndProve().catch((error) => {
                // It's a good practice to handle potential errors
                console.error("An error occurred during the login process:", error);
              });
            }}
          >
            Login with Google and Prove Uber trips
          </button>
        </div>
      ),
      cta: {
        label: "Learn more",
        url: "",
      },
    };
  }

  async handleLoginAndProve(): Promise<void> {
    const loginWithGoogle = new LoginWithGoogle();
    const gmail = new Gmail(loginWithGoogle);
    if (!loginWithGoogle.accessToken) {
      void loginWithGoogle.authorize({});
    }

    const sdk = initZkEmailSdk({});
    const blueprint = await sdk.getBlueprintById("f9de1c4a-b90c-47af-941f-d21a0ecf1411");

    // fetch emails
    const emailResponses = await gmail.fetchEmails([blueprint], {
      replaceQuery: "from:uber.com",
    });
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

    // send proofs to the server
  }

  // getOAuthUrl(state: string): Promise<string> {
  //   return new Promise((resolve) => {
  //     resolve(
  //       `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${this.redirectUri}&prompt=consent&response_type=code&client_id=${this.clientId}&scope=email+profile+https://www.googleapis.com/auth/gmail.readonly&access_type=offline&state=${state}`
  //     );
  //   });
  // }
}
