// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

import { PROVIDER_ID, Stamp, VerifiableCredentialRecord } from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

// --- import components
import { Card } from "../Card";

const providerId: PROVIDER_ID = "SecondSigner";

export default function SecondSignerCard(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // Open Signer authUrl in centered window
  function openSignerOAuthUrl(url: string): WindowProxy | null {
    const width = 600;
    const height = 800;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    // Pass data to the page via props
    return window.open(
      url,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );
  }

  const handleFetchCredential = async (): Promise<void> => {
    datadogLogs.logger.info("Starting verification", { provider: providerId });

    // this nonce should be provided by the server
    const nonce = new Uint32Array(10);
    self.crypto.getRandomValues(nonce);

    // generate a message to sign
    const message =
      "I commit that this wallet is under my control and that I wish to link it with my Passport.\n\nnonce: " +
      nonce.toString();
    // open a popup (must be on a different domain/port so that we're not triggering a wallet change on the opener window)
    const popup = openSignerOAuthUrl("http://localhost:8000") as WindowProxy;
    // pass message to popup and await signature
    const secondSignature: { addr: string; sig: string; msg: string } = await new Promise((resolve, reject) => {
      window.addEventListener("message", (event) => {
        if (event.data == "ready") {
          popup.postMessage(
            {
              cmd: "sign_message",
              msg: message,
            },
            "*"
          );
        } else if (event.data?.cmd == "sign_message") {
          popup.close();
          resolve({
            ...event.data,
          });
        } else if (event.data?.cmd == "sign_message_error") {
          popup.close();
          reject("Failed to get a second signature");
        }
      });
    });

    // show the signatures...
    console.log(secondSignature);

    // fetch the new credentials and save to the passport
    await fetchVerifiableCredential(
      iamUrl,
      {
        type: "SecondSigner",
        types: ["Poh"],
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
          scndMessage: message,
          scndAddress: secondSignature?.addr,
          scndSignature: secondSignature?.sig,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: VerifiableCredentialRecord): void => {
        verified.credentials?.forEach((cred) => {
          if (cred.record?.type === "Poh") {
            if (!cred.error) {
              handleAddStamp({
                provider: "Poh",
                credential: cred.credential,
              });
            }
          }
        });
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
        datadogRum.addError(e, { provider: providerId });
      });
  };

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-second-signer"
        className="verify-btn"
        onClick={async () => {
          // mark as verifying
          setVerificationInProgress(true);
          try {
            // fetch the credentials
            await handleFetchCredential();
          } finally {
            // mark as done
            setVerificationInProgress(false);
          }
        }}
      >
        Connect a second wallet
      </button>
    </>
  );

  return (
    <Card
      streamId={allProvidersState[providerId]!.stamp?.streamId}
      providerSpec={allProvidersState[providerId]!.providerSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={verificationInProgress}
    />
  );
}
