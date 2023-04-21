// --- Methods
import React, { useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import {
  Stamp,
  VerifiableCredential,
  CredentialResponseBody,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { ProviderPayload } from "@gitcoin/passport-platforms";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { SideBarContent } from "./SideBarContent";
import { DoneToastContent } from "./DoneToastContent";
import { useToast } from "@chakra-ui/react";
import { GenericBanner } from "./GenericBanner";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// --- Types
import { PlatformGroupSpec, Platform, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { getPlatformSpec } from "@gitcoin/passport-platforms/dist/commonjs/platforms-config";

// --- Helpers
import { difference, generateUID } from "../utils/helpers";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";
import { datadogRum } from "@datadog/browser-rum";
import { NoStampModal } from "./NoStampModal";

export type PlatformProps = {
  platFormGroupSpec: PlatformGroupSpec[];
  platform: PlatformClass;
  onClose: () => void;
};

enum VerificationStatuses {
  AllVerified,
  ReVerified,
  PartiallyVerified,
  AllRemoved,
  PartiallyRemoved,
  PartiallyRemovedAndVerified,
  Failed,
}

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

const checkIcon = "../../assets/check-icon.svg";

export const GenericPlatform = ({ platFormGroupSpec, platform, onClose }: PlatformProps): JSX.Element => {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, handleDeleteStamps, allProvidersState, userDid } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [showNoStampModal, setShowNoStampModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- Chakra functions
  const toast = useToast();

  // find all providerIds
  const providerIds = useMemo(
    () =>
      platFormGroupSpec?.reduce((all, stamp) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [],
    [platFormGroupSpec]
  );

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    providerIds.filter((providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined")
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // Create Set to check initial verified providers
  const initialVerifiedProviders = new Set(verifiedProviders);

  // any time we change selection state...
  useEffect(() => {
    setCanSubmit(selectedProviders.length !== verifiedProviders.length);
  }, [selectedProviders, verifiedProviders]);

  const waitForRedirect = (timeout?: number): Promise<ProviderPayload> => {
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

  const handleSponsorship = async (result: string): Promise<void> => {
    if (result === "success") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result) => (
          <div className="rounded-md bg-blue-darkblue p-2 text-white">
            <div className="flex p-4">
              <button className="inline-flex flex-shrink-0 cursor-not-allowed">
                <img
                  alt="information circle"
                  className="sticky top-0 mb-20 p-2"
                  src="./assets/information-circle-icon.svg"
                />
              </button>
              <div className="flex-grow pl-6">
                <h2 className="title-font mb-2 text-lg font-bold">Sponsored through Gitcoin for Bright ID</h2>
                <p className="text-base leading-relaxed">{`For verification status updates, check BrightID's App.`}</p>
                <p className="text-base leading-relaxed">
                  Once you are verified by BrightID - return here to complete this Stamp.
                </p>
              </div>
              <button className="inline-flex flex-shrink-0 rounded-lg" onClick={result.onClose}>
                <img alt="close button" className="rounded-lg p-2 hover:bg-gray-500" src="./assets/x-icon.svg" />
              </button>
            </div>
          </div>
        ),
      });
      datadogLogs.logger.info("Successfully sponsored user on BrightId", { platformId: platform.platformId });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      datadogLogs.logger.error("Error sponsoring user", { platformId: platform.platformId });
      datadogRum.addError("Failed to sponsor user on BrightId", { platformId: platform.platformId });
    }
  };

  // fetch VCs from IAM server
  const handleFetchCredential = async (): Promise<void> => {
    datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
    setLoading(true);
    try {
      const state = `${platform.path}-` + generateUID(10);
      const providerPayload = (await platform.getProviderPayload({
        state,
        window,
        screen,
        userDid,
        callbackUrl: window.location.origin,
        waitForRedirect,
      })) as {
        [k: string]: string;
      };

      if (providerPayload.sessionKey === "brightid") {
        handleSponsorship(providerPayload.code);
        return;
      }

      // This array will contain all providers that new validated VCs
      let vcs: Stamp[] = [];

      if (selectedProviders.length > 0) {
        const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
          iamUrl,
          {
            type: platform.platformId,
            types: selectedProviders,
            version: "0.0.0",
            address: address || "",
            proofs: providerPayload,
            rpcUrl,
          },
          signer as { signMessage: (message: string) => Promise<string> }
        );

        // because we provided a types array in the params we expect to receive a
        // credentials array in the response...
        if (verified.credentials) {
          for (let i = 0; i < verified.credentials.length; i++) {
            let cred = verified.credentials[i];
            if (!cred.error && providerIds.find((providerId: PROVIDER_ID) => cred?.record?.type === providerId)) {
              // add each of the requested/received stamps to the passport...
              vcs.push({
                provider: cred.record?.type as PROVIDER_ID,
                credential: cred.credential as VerifiableCredential,
              });
            }
          }
        }
      }

      // Delete all stamps ...
      await handleDeleteStamps(providerIds as PROVIDER_ID[]);

      // .. and now add all newly validate stamps
      if (vcs.length > 0) {
        await handleAddStamps(vcs);
      }
      datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
      // grab all providers who are verified from the verify response
      const actualVerifiedProviders = providerIds.filter(
        (providerId) =>
          !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
      );
      // both verified and selected should look the same after save
      setVerifiedProviders([...actualVerifiedProviders]);
      setSelectedProviders([...actualVerifiedProviders]);

      // Create Set to check changed providers after verification
      const updatedVerifiedProviders = new Set(actualVerifiedProviders);
      // Initial providers Set minus updated providers Set to determine which data points were removed
      const initialMinusUpdated = difference(initialVerifiedProviders, updatedVerifiedProviders);
      // Updated providers Set minus initial providers Set to determine which data points were added
      const updatedMinusInitial = difference(updatedVerifiedProviders, initialVerifiedProviders);
      // reset can submit state
      setCanSubmit(false);

      const verificationStatus = getVerificationStatus(
        updatedVerifiedProviders,
        initialMinusUpdated,
        updatedMinusInitial
      );

      if (
        verificationStatus === VerificationStatuses.Failed &&
        platform.isEVM &&
        process.env.NEXT_PUBLIC_FF_MULTI_EVM_SIGNER === "on"
      ) {
        setShowNoStampModal(true);
      }

      // Get the done toast messages
      const { title, body, icon, platformId } = getDoneToastMessages(
        verificationStatus,
        updatedVerifiedProviders,
        initialMinusUpdated,
        updatedMinusInitial
      );

      // Display done toast
      doneToast(title, body, icon, platformId);

      setLoading(false);
    } catch (e) {
      datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
      doneToast(
        "Verification Failed",
        "There was an error verifying your stamp. Please try again.",
        "../../assets/verification-failed.svg",
        platform.platformId as PLATFORM_ID
      );
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  // --- Done Toast Helper
  const doneToast = (title: string, body: string, icon: string, platformId: PLATFORM_ID) => {
    toast({
      duration: 9000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent title={title} body={body} icon={icon} platformId={platformId} result={result} />
      ),
    });
  };

  const getVerificationStatus = (
    updatedVerifiedProviders: Set<PROVIDER_ID>,
    initialMinusUpdated: Set<PROVIDER_ID>,
    updatedMinusInitial: Set<PROVIDER_ID>
  ) => {
    if (updatedMinusInitial.size === providerIds.length) {
      return VerificationStatuses.AllVerified;
    } else if (updatedVerifiedProviders.size > 0 && updatedMinusInitial.size === 0 && initialMinusUpdated.size === 0) {
      return VerificationStatuses.ReVerified;
    } else if (updatedMinusInitial.size > 0 && initialMinusUpdated.size === 0) {
      return VerificationStatuses.PartiallyVerified;
    } else if (initialMinusUpdated.size > 0 && updatedMinusInitial.size === 0 && selectedProviders.length === 0) {
      return VerificationStatuses.AllRemoved;
    } else if (initialMinusUpdated.size > 0 && updatedMinusInitial.size === 0) {
      return VerificationStatuses.PartiallyRemoved;
    } else if (updatedMinusInitial.size > 0 && initialMinusUpdated.size > 0) {
      return VerificationStatuses.PartiallyRemovedAndVerified;
    } else {
      return VerificationStatuses.Failed;
    }
  };

  // Done toast message getter
  const getDoneToastMessages = (
    verificationStatus: VerificationStatuses,
    initialMinusUpdated: Set<PROVIDER_ID>,
    updatedMinusInitial: Set<PROVIDER_ID>,
    updatedVerifiedProviders: Set<PROVIDER_ID>
  ) => {
    // Switch statement to determine which toast message to display based on VerificationStatuses enum
    switch (verificationStatus) {
      case VerificationStatuses.AllVerified:
        return {
          title: "Done!",
          body: `All ${platform.platformId} data points verified.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.ReVerified:
        return {
          title: "Success!",
          body: `Successfully re-verified ${platform.platformId} data ${
            updatedVerifiedProviders.size > 1 ? "points" : "point"
          }.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyVerified:
        return {
          title: "Success!",
          body: `Successfully verified ${platform.platformId} data ${
            updatedMinusInitial.size > 1 ? "points" : "point"
          }.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.AllRemoved:
        return {
          title: "Success!",
          body: `All ${platform.platformId} data points removed.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyRemoved:
        return {
          title: "Success!",
          body: `Successfully removed ${platform.platformId} data ${
            initialMinusUpdated.size > 1 ? "points" : "point"
          }.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyRemovedAndVerified:
        return {
          title: "Success!",
          body: `${initialMinusUpdated.size} ${platform.platformId} data ${
            initialMinusUpdated.size > 1 ? "points" : "point"
          } removed and ${updatedMinusInitial.size} verified.`,
          icon: checkIcon,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.Failed:
        return {
          title: "Verification Failed",
          body: "Please make sure you fulfill the requirements for this stamp.",
          icon: "../../assets/verification-failed.svg",
          platformId: platform.platformId as PLATFORM_ID,
        };
    }
  };

  return (
    <>
      <SideBarContent
        currentPlatform={getPlatformSpec(platform.platformId)}
        currentProviders={platFormGroupSpec}
        verifiedProviders={verifiedProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={setSelectedProviders}
        isLoading={isLoading}
        infoElement={platform.banner ? <GenericBanner banner={platform.banner} /> : undefined}
        verifyButton={
          <>
            <button
              disabled={!submitted && !canSubmit}
              onClick={canSubmit ? handleFetchCredential : onClose}
              data-testid={`button-verify-${platform.platformId}`}
              className="sidebar-verify-btn"
            >
              {submitted && !canSubmit ? "Close" : verifiedProviders.length > 0 ? "Save" : "Verify"}
            </button>
          </>
        }
      />
      <NoStampModal isOpen={showNoStampModal} onClose={() => setShowNoStampModal(false)} />
    </>
  );
};
