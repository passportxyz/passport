import { providers } from "@gitcoin/passport-platforms";
// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchChallengeCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { PLATFORM_ID, PROVIDER_ID, VerifiableCredential, VerifiedPayload } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { PlatformGroupSpec } from "../config/providers";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const providerId: PROVIDER_ID = "Signer";
const signerUrl = process.env.NEXT_PUBLIC_PASSPORT_SIGNER_URL || "http://localhost:8000/";
export type AdditionalSignature = { addr: string; sig: string; msg: string; challenge: VerifiableCredential };

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

export const signMessageForAdditionalSigner = async (message: string): Promise<string> => {
  const iframe = openSigner(signerUrl) as HTMLIFrameElement;
  // pass message to iframe and await signature
  const extraSignature: AdditionalSignature = await new Promise((resolve, reject) => {
    const killSwitch = setTimeout(() => {
      // reject the outer promise
      reject("Failed to get a ready response from the signer page in time...");
    }, 5000);

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
            msg: message,
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

  return extraSignature.sig;
};

export const fetchAdditionalSigner = async (address: string): Promise<AdditionalSignature> => {
  datadogLogs.logger.info("Starting verification", { provider: providerId });

  // get a challenge string - this should get an appropriate message back from the iam server to sign with the second account
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
        // cleanup
        clearListener();
        // resolve outer with the signed message result
        resolve({
          ...event.data,
          challenge,
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
};

export type PossibleEVMProvider = {
  validatedPlatformGroups: {
    payload: VerifiedPayload;
    providerType: PROVIDER_ID;
  }[][];
  platformProps: PlatformProps;
};

export const fetchPossibleEVMStamps = async (
  address: string,
  allPlatforms: Map<PLATFORM_ID, PlatformProps>
): Promise<PossibleEVMProvider[]> => {
  const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

  // Extract EVM platforms
  const evmPlatforms: PlatformProps[] = [];
  const evmPlatformGroupSpecs: PlatformGroupSpec[] = [];
  allPlatforms.forEach((value, key, map) => {
    const platformProp = map.get(key);
    if (platformProp?.platform.isEVM) {
      evmPlatformGroupSpecs.push(...platformProp.platFormGroupSpec);
      evmPlatforms.push(platformProp);
    }
  });

  // Build requests for each verify function within every EVM Provider
  const providerRequests = evmPlatforms.map((platform) => {
    const validatedProviderGroup = platform.platFormGroupSpec.map((groupSpec) => {
      return groupSpec.providers.map(async (provider) => {
        const payload = await providers.verify(
          provider.name,
          { type: provider.name, address, version: "0.0.0", rpcUrl },
          {}
        );
        return {
          payload,
          providerType: provider.name,
        };
      });
    });
    return { validatedProviderGroup, platform };
  });

  // Resolve nested promises
  const validatedPlatforms = await Promise.all(
    providerRequests.map(async (requestedPlatform) => {
      const validatedPlatformGroups = await Promise.all(
        requestedPlatform.validatedProviderGroup.map(async (group) => {
          const validatedProviders = await Promise.all(group);
          return validatedProviders;
        })
      );
      return { validatedPlatformGroups, platformProps: requestedPlatform.platform };
    })
  );

  // Look for valid stamps and return the provider group if valid
  const validPlatforms = validatedPlatforms.filter((validatedPlatform) => {
    // If any of the providers in the group are valid, then the group is valid
    const validGroup = validatedPlatform.validatedPlatformGroups.filter((group) => {
      return (
        group.filter((provider) => {
          return provider.payload.valid;
        }).length > 0
      );
    });
    return validGroup.length > 0;
  });

  return validPlatforms;
};
