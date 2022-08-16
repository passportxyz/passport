// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import {
  fetchChallengeCredential,
  fetchVerifiableCredential,
} from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Shared context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Types
import { PROVIDER_ID, Stamp, VerifiableCredentialRecord } from "@gitcoin/passport-types";

// --- Constants
const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const providerId: PROVIDER_ID = "Signer";
const signerUrl = process.env.NEXT_PUBLIC_PASSPORT_SIGNER_URL || "http://localhost:8000/";

// --- Components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { useToast } from "@chakra-ui/react";

// This card handles requesting a second signature and submitting all proofs along with an array of providers to verify
export default function SignerCard(): JSX.Element {
  // pull context in to element
  const { address, signer } = useContext(UserContext);
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const toast = useToast();

  // open Signer url in an iframe
  function openSigner(url: string): HTMLIFrameElement {
    // create the iframe
    const iframe = document.createElement("iframe");
    // set src - for this to work the src must be hosted separately from the front-end
    iframe.setAttribute("src", url);
    // hide the iframe
    iframe.setAttribute("style", "height:0px;width:0px;outline:none;border:0;opacity:0;");
    // append to the body
    document.body.appendChild(iframe);

    // return the frame - we can send messages with iframe.contentWindow.postMessage
    return iframe;
  }

  // fetch signatures and submit to iam server
  const handleFetchCredential = async (): Promise<void> => {
    datadogLogs.logger.info("Starting verification", { provider: providerId });

    // get a callenge string - this should get an appropriate message back from the iam server to sign with the second account
    const { challenge } = await fetchChallengeCredential(iamUrl, {
      type: "SignerChallenge",
      version: "0.0.0",
      address: address || "",
    });

    // open an iframe (must be on a different domain/port so that we're not triggering a wallet change on the parent window)
    // * note: this domain will appear in the metamask window
    // - replace signerUrl with "/signer.html" to see how bad the ux would be if we were to handle this on the same domain
    const iframe = openSigner(signerUrl) as HTMLIFrameElement;

    // pass message to iframe and await signature
    const extraSignature: { addr: string; sig: string; msg: string } = await new Promise((resolve, reject) => {
      // set a kill switch incase the page fails to load in time
      const killSwitch = setTimeout(() => {
        // reject the outer promise
        reject("Failed to get a ready response from the signer page in time...");
      }, 5000);
      // clean-up func to remove listener and iframe
      const clearListener = () => {
        // if the message was received and signed, the signer will response with a "sign_message" cmd
        document.body.removeChild(iframe);
        // remove this listener - its job is done
        window.removeEventListener("message", listener);
      };
      // attach this listener to the message challenge (it includes its own teardown procedure)
      const listener = (event: MessageEvent) => {
        if (event.data == "ready") {
          // clear the kill switch - page has loaded
          clearTimeout(killSwitch);
          // send the challenge string we want a signed message for...
          iframe.contentWindow?.postMessage(
            {
              cmd: "sign_message",
              msg: challenge.credentialSubject.challenge,
              host: `${window.location.protocol}//${window.location.host}`,
            },
            // this should be the hosted instances domain
            signerUrl
          );
        } else if (event.data?.cmd == "signed_message") {
          // cleanup
          clearListener();
          // resolve outer with the signed message result
          resolve({
            ...event.data,
          });
        } else if (event.data?.cmd == "sign_message_error") {
          // cleanup
          clearListener();
          // reject the outer promise
          reject("Failed to get signature");
        }
      };
      // attach the listener so that we can receive responses from the iframe
      window.addEventListener("message", listener);
    });

    // show the signatures...
    console.log(extraSignature);

    // fetch the new credentials and save to the passport
    await fetchVerifiableCredential(
      iamUrl,
      {
        type: "Signer",
        types: ["Poh", "POAP", "Ens"],
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
        },
        signer: {
          challenge: challenge,
          signature: extraSignature?.sig,
          address: extraSignature?.addr,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then(async (verified: VerifiableCredentialRecord): void => {
        // tot the number of added stamps
        let added = 0;
        // because we provided a types array in the params we expect to receive a credentials array in the response...
        for (const cred in verified.credentials) {
          if (!cred.error) {
            // add each of the requested/received stamps to the passport...
            if (cred.record?.type === "Poh") {
              added++;
              await handleAddStamp({
                provider: "Poh",
                credential: cred.credential,
              });
            } else if (cred.record?.type === "POAP") {
              added++;
              await handleAddStamp({
                provider: "POAP",
                credential: cred.credential,
              });
            } else if (cred.record?.type === "Ens") {
              added++;
              await handleAddStamp({
                provider: "Ens",
                credential: cred.credential,
              });
            }
          } else {
          }
        }
        // Custom Success Toast
        toast({
          duration: 5000,
          isClosable: true,
          render: (result: any) => (
            <DoneToastContent
              providerId={providerId}
              message={`${added > 0 ? `Successfully added` : `Discovered`} ${added} stamp${
                added !== 1 ? `s` : ``
              } using wallet: ${extraSignature?.addr}.`}
              result={result}
            />
          ),
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
        data-testid="button-verify-signer"
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
        Connect an Ethereum account
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
