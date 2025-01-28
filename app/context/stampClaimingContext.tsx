// --- Methods
import React, { createContext, useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import { VerifiableCredential, PROVIDER_ID, PLATFORM_ID, StampPatch, ValidResponseBody } from "@gitcoin/passport-types";
import { Platform, ProviderPayload } from "@gitcoin/passport-platforms";
import { fetchVerifiableCredential } from "../utils/credentials";

// --- Context
import { CeramicContext } from "../context/ceramicContext";

// --- Types
import { PlatformClass } from "@gitcoin/passport-platforms";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";

// --- Helpers
import { createSignedPayload, generateUID } from "../utils/helpers";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";
import { datadogRum } from "@datadog/browser-rum";
import { useDatastoreConnectionContext } from "./datastoreConnectionContext";
import { useMessage } from "../hooks/useMessage";
import { usePlatforms } from "../hooks/usePlatforms";
import { useAccount } from "wagmi";

export enum StampClaimProgressStatus {
  Idle = "idle",
  InProgress = "in_progress",
}

export type VerificationStatuses = { success: string[]; errors: string[] };

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
    handleClaimStep: (step: number) => Promise<void>,
    indicateError: (platform: PLATFORM_ID | "EVMBulkVerify") => void,
    platformGroups: StampClaimForPlatform[]
  ) => Promise<void>;
  status: StampClaimProgressStatus;
}

const startingState: StampClaimingContextState = {
  claimCredentials: async (
    handleClaimStep: (step: number) => Promise<void>,
    indicateError: (platform: PLATFORM_ID | "EVMBulkVerify") => void,
    platformGroups: StampClaimForPlatform[]
  ) => {},
  status: StampClaimProgressStatus.Idle,
};

export const StampClaimingContext = createContext(startingState);

export const StampClaimingContextProvider = ({ children }: { children: any }) => {
  const { handlePatchStamps, userDid } = useContext(CeramicContext);
  const { address } = useAccount();
  const { did } = useDatastoreConnectionContext();
  const { success, failure } = useMessage();
  const [status, setStatus] = useState(StampClaimProgressStatus.Idle);
  const { platforms } = usePlatforms();

  const handleSponsorship = async (platform: PlatformClass, result: string): Promise<void> => {
    if (result === "success") {
      success({
        title: "Sponsored through Gitcoin for Bright ID",
        message:
          "For verification status updates, check BrightID's App. Once you are verified by BrightID - return here to complete this Stamp.",
      });
      datadogLogs.logger.info("Successfully sponsored user on BrightId", { platformId: platform.platformId });
    } else {
      failure({
        title: "Failure",
        message: "Failed to trigger BrightID Sponsorship",
      });
      datadogLogs.logger.error("Error sponsoring user", { platformId: platform.platformId });
      datadogRum.addError("Failed to sponsor user on BrightId", { platformId: platform.platformId });
    }
  };

  // fetch VCs from IAM server
  const claimCredentials = async (
    handleClaimStep: (step: number) => Promise<void>,
    indicateError: (platform: PLATFORM_ID | "EVMBulkVerify") => void,
    platformGroups: StampClaimForPlatform[]
  ): Promise<any> => {
    if (!did) throw new Error("No DID found");

    // In `step` we count the number of steps / platforms we are processing.
    // This will different form i because we may skip some platforms that have no expired
    // providers
    let step = -1;

    for (let i = 0; i < platformGroups.length; i++) {
      setStatus(StampClaimProgressStatus.Idle);
      try {
        const { platformId, selectedProviders } = platformGroups[i];
        const platform = platforms.get(platformId as PLATFORM_ID)?.platform;

        if ((platform || platformId === "EVMBulkVerify") && selectedProviders.length > 0) {
          step++;
          await handleClaimStep(step);
          datadogLogs.logger.info("Saving Stamp", { platform: platformId });
          setStatus(StampClaimProgressStatus.InProgress);

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
            (data: any) => createSignedPayload(did, data)
          );

          const verifiedCredentials =
            selectedProviders.length > 0
              ? verifyCredentialsResponse.credentials?.filter((cred: any): cred is ValidResponseBody => !cred.error) ||
                []
              : [];

          if (verifiedCredentials.length === 0) {
            indicateError(platformId);
          }

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
    setStatus(StampClaimProgressStatus.Idle);
  };

  const providerProps = {
    claimCredentials,
    status,
  };

  return <StampClaimingContext.Provider value={providerProps}>{children}</StampClaimingContext.Provider>;
};
