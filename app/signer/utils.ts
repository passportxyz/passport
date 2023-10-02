// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import { fetchChallengeCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { CheckResponseBody, Passport, PLATFORM_ID, PROVIDER_ID, VerifiableCredential } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { PlatformGroupSpec } from "../config/providers";

import axios from "axios";
import { iamUrl } from "../config/stamp_config";

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

export type ValidatedProvider = {
  name: PROVIDER_ID;
  title: string;
};

export type ValidatedProviderGroup = {
  providers: ValidatedProvider[];
  name: string;
};

export type ValidatedPlatform = {
  groups: ValidatedProviderGroup[];
  platformProps: PlatformProps;
};

const getTypesToCheck = (evmPlatforms: PlatformProps[], passport: Passport | undefined | false): PROVIDER_ID[] => {
  const existingProviders = passport && passport.stamps.map((stamp) => stamp.provider);

  const evmProviders: PROVIDER_ID[] = evmPlatforms
    .map(({ platFormGroupSpec }) => platFormGroupSpec.map(({ providers }) => providers.map(({ name }) => name)))
    .flat(2);

  if (existingProviders) {
    return evmProviders.filter((provider) => !existingProviders.includes(provider));
  } else {
    return evmProviders;
  }
};

// These are type-guarded filters which tell typescript that
// objects which pass this filter are of the defined type
const filterUndefined = <T>(item: T | undefined): item is T => !!item;

export const fetchPossibleEVMStamps = async (
  address: string,
  allPlatforms: Map<PLATFORM_ID, PlatformProps>,
  passport: Passport | undefined | false
): Promise<ValidatedPlatform[]> => {
  const allPlatformsData = Array.from(allPlatforms.values());
  const evmPlatforms: PlatformProps[] = allPlatformsData.filter(({ platform }) => platform.isEVM);

  const payload = {
    type: "bulk",
    types: getTypesToCheck(evmPlatforms, passport),
    address,
    version: "0.0.0",
  };

  let response: { data: CheckResponseBody[] };
  try {
    response = await axios.post(`${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/check`, {
      payload,
    });
  } catch (e) {
    console.error(e);
    return [];
  }

  const validPlatformIds = response.data.reduce(
    (platforms: string[], { type, valid }) => (valid ? [...platforms, type] : platforms),
    []
  );

  // Define helper functions to filter out invalid providers and groups
  const getValidGroupProviders = (groupSpec: PlatformGroupSpec): ValidatedProvider[] =>
    groupSpec.providers.reduce((providers: ValidatedProvider[], provider) => {
      const { name, title } = provider;
      if (validPlatformIds.includes(name)) return [...providers, { name, title }];
      else return providers;
    }, []);

  const getValidPlatformGroups = (platform: PlatformProps): ValidatedProviderGroup[] =>
    platform.platFormGroupSpec
      .map((groupSpec) => {
        const groupProviders = getValidGroupProviders(groupSpec);
        if (groupProviders.length !== 0)
          return {
            name: groupSpec.platformGroup,
            providers: groupProviders,
          };
      })
      .filter(filterUndefined);

  // Return the platforms with valid groups
  return evmPlatforms
    .map((platform) => {
      const validPlatformGroups = getValidPlatformGroups(platform);
      if (validPlatformGroups.length !== 0)
        return {
          groups: validPlatformGroups,
          platformProps: platform,
        };
    })
    .filter(filterUndefined);
};
