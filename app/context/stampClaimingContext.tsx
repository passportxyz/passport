// --- Methods
import React, { createContext, useContext } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import { VerifiableCredential, PROVIDER_ID, PLATFORM_ID, StampPatch } from "@gitcoin/passport-types";
import { Platform, ProviderPayload } from "@gitcoin/passport-platforms";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Context
import { CeramicContext, platforms } from "../context/ceramicContext";
import { useWalletStore, useSigner } from "../context/walletStore";

// --- Types
import { PlatformClass } from "@gitcoin/passport-platforms";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";

// --- Helpers
import { generateUID } from "../utils/helpers";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";
import { datadogRum } from "@datadog/browser-rum";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";

const success = "../../assets/check-icon2.svg";
const fail = "../assets/verification-failed-bright.svg";

export const waitForRedirect = (platform: Platform, timeout?: number): Promise<ProviderPayload> => {
  const channel = new BroadcastChannel(`${platform.path}_oauth_channel`);
  const waitForRedirect = new Promise<ProviderPayload>((resolve, reject) => {
    // Listener to watch for oauth redirect response on other windows (on the same host)
    function listenForRedirect(e: { target: string; data: { code: string; state: string } }) {
      // when receiving oauth response from a spawned child run fetchVerifiableCredential
      if (e.target === platform.path) {
        // pull data from message
        const queryCode = e.data.code;
        const queryState = e.data.state;
        datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
        try {
          resolve({ code: queryCode, state: queryState });
        } catch (e) {
          datadogLogs.logger.error("Error saving Stamp", { platform: platform.platformId });
          console.error(e);
          reject(e);
        }
      }
    }
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    channel.onmessage = debounce(listenForRedirect, 300);
  }).finally(() => {
    channel.close();
  });
  return waitForRedirect;
};
export type StampClaimForPlatform = {
  platformId: PLATFORM_ID | "EVMBulkVerify";
  selectedProviders: PROVIDER_ID[];
};

export interface StampClaimingContextState {
  claimCredentials: (
    handleClaimStep: (step: number, status: string) => Promise<void>,
    platformGroups: StampClaimForPlatform[]
  ) => Promise<void>;
}

const startingState: StampClaimingContextState = {
  claimCredentials: async (
    handleClaimStep: (step: number, status: string) => Promise<void>,
    platformGroups: StampClaimForPlatform[]
  ) => {},
};

export const StampClaimingContext = createContext(startingState);

export const StampClaimingContextProvider = ({ children }: { children: any }) => {
  const { handlePatchStamps, userDid } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);
  const signer = useSigner();
  const toast = useToast();

  const handleSponsorship = async (platform: PlatformClass, result: string): Promise<void> => {
    if (result === "success") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <div className="rounded-md bg-color-1 text-background-2">
            <div className="flex p-4">
              <button className="inline-flex flex-shrink-0 cursor-not-allowed">
                <img alt="information circle" className="sticky top-0 mb-20 p-2" src={success} />
              </button>
              <div className="flex-grow pl-6">
                <h2 className="mb-2 text-lg font-bold">Sponsored through Gitcoin for Bright ID</h2>
                <p className="text-base leading-relaxed">{`For verification status updates, check BrightID's App.`}</p>
                <p className="text-base leading-relaxed">
                  Once you are verified by BrightID - return here to complete this Stamp.
                </p>
              </div>
              <button className="inline-flex flex-shrink-0 rounded-lg" onClick={result.onClose}>
                <img alt="close button" className="rounded-lg p-2 hover:bg-gray-500" src="./assets/x-icon-black.svg" />
              </button>
            </div>
          </div>
        ),
      });
      datadogLogs.logger.info("Successfully sponsored user on BrightId", { platformId: platform.platformId });
    } else {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Failure"
            message="Failed to trigger BrightID Sponsorship"
            icon={fail}
            result={result}
          />
        ),
      });
      datadogLogs.logger.error("Error sponsoring user", { platformId: platform.platformId });
      datadogRum.addError("Failed to sponsor user on BrightId", { platformId: platform.platformId });
    }
  };

  // fetch VCs from IAM server
  const claimCredentials = async (
    handleClaimStep: (step: number, status: string) => Promise<void>,
    platformGroups: StampClaimForPlatform[]
  ): Promise<any> => {
    for (let i = 0; i < platformGroups.length; i++) {
      try {
        const { platformId, selectedProviders } = platformGroups[i];
        if (platformId !== "EVMBulkVerify" && i > 0) await handleClaimStep(i, "wait_confirmation");
        datadogLogs.logger.info("Saving Stamp", { platform: platformId });
        const platform = platforms.get(platformId as PLATFORM_ID)?.platform;

        await handleClaimStep(i, "in_progress");

        if ((platform || platformId === "EVMBulkVerify") && selectedProviders.length > 0) {
          // We set the providerPayload to be {} by default
          // This is ok if platformId === "EVMBulkVerify"
          // For other platforms the correct providerPayload will be set below
          let providerPayload: {
            [k: string]: string;
          } = {};

          if (platform) {
            // This if should only be true if platformId !== "EVMBulkVerify"
            const state = `${platform.path}-` + generateUID(10);
            providerPayload = (await platform.getProviderPayload({
              state,
              window,
              screen,
              userDid,
              callbackUrl: window.location.origin,
              selectedProviders,
              waitForRedirect,
            })) as {
              [k: string]: string;
            };

            if (providerPayload.sessionKey === "brightid") {
              handleSponsorship(platform, providerPayload.code as string);
              return;
            }
          }

          const verifyCredentialsResponse = await fetchVerifiableCredential(
            iamUrl,
            {
              type: platformId,
              types: selectedProviders,
              version: "0.0.0",
              address: address || "",
              proofs: providerPayload,
              signatureType: IAM_SIGNATURE_TYPE,
            },
            signer as { signMessage: (message: string) => Promise<string> }
          );

          const verifiedCredentials =
            selectedProviders.length > 0
              ? verifyCredentialsResponse.credentials?.filter((cred: any) => !cred.error) || []
              : [];

          const stampPatches: StampPatch[] = selectedProviders.map((provider: PROVIDER_ID) => {
            const cred = verifiedCredentials.find((cred: any) => cred.record?.type === provider);
            if (cred) return { provider, credential: cred.credential as VerifiableCredential };
            else return { provider };
          });

          await handlePatchStamps(stampPatches);
        } else {
          datadogLogs.logger.error("Request for claiming stamp for invalid platform", { platform: platformId });
        }
      } catch (e) {
        datadogLogs.logger.error("Verification Error", { error: e, platform: platformGroups[i] });
      }
    }
    await handleClaimStep(-1, "all_done");
  };

  const providerProps = {
    claimCredentials,
  };

  return <StampClaimingContext.Provider value={providerProps}>{children}</StampClaimingContext.Provider>;
};
