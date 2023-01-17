// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import {
  fetchChallengeCredential,
  fetchVerifiableCredential,
} from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { PROVIDER_ID } from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const providerId: PROVIDER_ID = "Signer";
const signerUrl = process.env.NEXT_PUBLIC_PASSPORT_SIGNER_URL || "http://localhost:8000/";
export type AdditionalSignature = { addr: string; sig: string; msg: string };

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

export const fetchAdditionalSigner = async (address: string): Promise<AdditionalSignature> => {
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
  const extraSignature: AdditionalSignature = await new Promise((resolve, reject) => {
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
        console.log({ event }, "signed_message");
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
  return extraSignature;
  // console.log({ extraSignature });
  // We should have an extraSignature, time to fetch what stamps they COULD include
  // await fetchVerifiableCredential(
  //   iamUrl,
  //   {
  //     type: "Signer",
  //     types: ["Poh", "POAP", "Ens"],
  //     version: "0.0.0",
  //     address: address || "",
  //     proofs: {
  //       valid: address ? "true" : "false",
  //     },
  //     signer: {
  //       challenge: challenge,
  //       signature: extraSignature?.sig,
  //       address: extraSignature?.addr,
  //     },
  //   },
  //   signer as { signMessage: (message: string) => Promise<string> }
  // )
  //   .then(async (verified: VerifiableCredentialRecord): Promise<(Stamp | undefined)[]> => {
  //     // because we provided a types array in the params we expect to receive a credentials array in the response...
  //     const vcs =
  //       verified.credentials
  //         ?.map((cred: CredentialResponseBody): Stamp | undefined => {
  //           if (!cred.error) {
  //             // add each of the requested/received stamps to the passport...
  //             return {
  //               provider: cred.record?.type as PROVIDER_ID,
  //               credential: cred.credential as VerifiableCredential,
  //             };
  //           }
  //         })
  //         .filter((v: Stamp | undefined) => v) || [];
  //     return vcs;
  //   })
  //   .catch((e: any): void => {
  //     datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
  //     datadogRum.addError(e, { provider: providerId });
  //     return undefined;
  //   });
  // return undefined;
};
