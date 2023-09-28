// --- Methods
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import {
  VerifiableCredential,
  CredentialResponseBody,
  PROVIDER_ID,
  PLATFORM_ID,
  StampPatch,
  SignatureType,
} from "@gitcoin/passport-types";
import { Platform, ProviderPayload } from "@gitcoin/passport-platforms";
import { fetchVerifiableCredential, verifyCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { SideBarContent } from "./SideBarContent";
import { DoneToastContent } from "./DoneToastContent";
import { useToast } from "@chakra-ui/react";
import { LoadButton } from "./LoadButton";
import { JsonOutputModal } from "./JsonOutputModal";

// --- Context
import { CeramicContext, platforms } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// --- Types
import { PlatformGroupSpec } from "@gitcoin/passport-platforms";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { getPlatformSpec } from "../config/platforms";
import { IAM_SIGNATURE_TYPE } from "../config/stamp_config";

// --- Helpers
import { difference, generateUID } from "../utils/helpers";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";
import { datadogRum } from "@datadog/browser-rum";
import { NoStampModal } from "./NoStampModal";
import { PlatformScoreSpec } from "../context/scorerContext";

export type PlatformProps = {
  platFormGroupSpec: PlatformGroupSpec[];
  platform: PlatformClass;
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

const success = "../../assets/check-icon2.svg";
const fail = "../assets/verification-failed-bright.svg";

type GenericPlatformProps = PlatformProps & { onClose: () => void; platformScoreSpec: PlatformScoreSpec };

const arraysContainSameElements = (a: any[], b: any[]) => {
  return a.length === b.length && a.every((v) => b.includes(v));
};

const waitForRedirect = (platform: Platform, timeout?: number): Promise<ProviderPayload> => {
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

export interface StampClaimingContextState {
  handleFetchCredential: (
    // platFormGroupSpec: PlatformGroupSpec[],
    // platform: PlatformClass,
    // selectedProviders: PROVIDER_ID[]
    platformGroups: Record<PLATFORM_ID, { providers: PROVIDER_ID[] }>
  ) => Promise<void>;
}

const startingState: StampClaimingContextState = {
  handleFetchCredential: async (
    // platFormGroupSpec: PlatformGroupSpec[],
    // platform: PlatformClass,
    // selectedProviders: PROVIDER_ID[]
    platformGroups: Record<PLATFORM_ID, { providers: PROVIDER_ID[] }>
  ) => {},
};

export const StampClaimingContext = createContext(startingState);

export const StampClaimingContextProvider = ({ children }: { children: any }) => {
  const { handlePatchStamps, verifiedProviderIds, allProvidersState, userDid } = useContext(CeramicContext);
  const { address, signer } = useContext(UserContext);
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
  const handleFetchCredential = async (
    // platFormGroupSpec: PlatformGroupSpec[],
    // platform: PlatformClass,
    // selectedProviders: PROVIDER_ID[]
    platformGroups: Record<PLATFORM_ID, { providers: PROVIDER_ID[] }>
  ): Promise<void> => {
    try {
      for (const platformId in platformGroups) {
        datadogLogs.logger.info("Saving Stamp", { platform: platformId });
        const selectedProviders = platformGroups[platformId as PLATFORM_ID].providers;
        const platform = platforms.get(platformId as PLATFORM_ID)?.platform;

        if ((platform || platformId === "EVMBulkVerify") && selectedProviders.length > 0) {
          // We set the providerPayload to be {} by default
          // This is ok if platformId === "EVMBulkVerify"
          // For other platforms the correct providerPayload will be set below
          let providerPayload: ProviderPayload = {};

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
      }
    } catch (e) {
      // TODO: geri: error handling
      throw e;
      // datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
      // doneToast(
      //   "Verification Failed",
      //   "There was an error verifying your stamp. Please try again.",
      //   fail,
      //   platform.platformId as PLATFORM_ID
      // );
    }
  };

  const providerProps = {
    handleFetchCredential,
  };

  return <StampClaimingContext.Provider value={providerProps}>{children}</StampClaimingContext.Provider>;
};

export const GenericPlatform = ({
  platFormGroupSpec,
  platform,
  platformScoreSpec,
  onClose,
}: GenericPlatformProps): JSX.Element => {
  const { address, signer } = useContext(UserContext);
  const { handlePatchStamps, verifiedProviderIds, userDid } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [showNoStampModal, setShowNoStampModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationResponse, setVerificationResponse] = useState<CredentialResponseBody[]>([]);
  const [payloadModalIsOpen, setPayloadModalIsOpen] = useState(false);
  // const { handleFetchCredential } = useContext(StampClaimingContext);

  // --- Chakra functions
  const toast = useToast();

  // find all providerIds
  const platformProviderIds = useMemo(
    () =>
      platFormGroupSpec?.reduce((all, stamp) => {
        return all.concat(stamp.providers?.map((provider: any) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [],
    [platFormGroupSpec]
  );

  // VerifiedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    platformProviderIds.filter((providerId: any) => verifiedProviderIds.includes(providerId))
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // Create Set to check initial verified providers
  const initialVerifiedProviders = new Set(verifiedProviders);

  // any time we change selection state...
  useEffect(() => {
    setCanSubmit(selectedProviders.length > 0 && !arraysContainSameElements(selectedProviders, verifiedProviders));
  }, [selectedProviders, verifiedProviders]);

  const handleSponsorship = async (result: string): Promise<void> => {
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
        selectedProviders,
        waitForRedirect,
      })) as {
        [k: string]: string;
      };

      if (providerPayload.sessionKey === "brightid") {
        handleSponsorship(providerPayload.code);
        return;
      }

      const verifyCredentialsResponse = await fetchVerifiableCredential(
        iamUrl,
        {
          type: platform.platformId,
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

      setVerificationResponse(verifyCredentialsResponse.credentials || []);

      const stampPatches: StampPatch[] = platformProviderIds.map((provider: PROVIDER_ID) => {
        const cred = verifiedCredentials.find((cred: any) => cred.record?.type === provider);
        if (cred) return { provider, credential: cred.credential as VerifiableCredential };
        else return { provider };
      });

      await handlePatchStamps(stampPatches);

      datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
      // grab all providers who are verified from the verify response
      const actualVerifiedProviders = platformProviderIds.filter(
        (providerId: any) =>
          !!stampPatches.find((stampPatch) => stampPatch?.credential?.credentialSubject?.provider === providerId)
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

      const bodyWithDetailsLink = (
        <>
          {body}
          <a className="cursor-pointer underline" onClick={() => setPayloadModalIsOpen(true)}>
            See Details
          </a>
        </>
      );

      // Display done toast
      doneToast(title, bodyWithDetailsLink, icon, platformId);

      setLoading(false);
    } catch (e) {
      datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
      doneToast(
        "Verification Failed",
        "There was an error verifying your stamp. Please try again.",
        fail,
        platform.platformId as PLATFORM_ID
      );
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  // --- Done Toast Helper
  const doneToast = (title: string, body: string | JSX.Element, icon: string, platformId: PLATFORM_ID) => {
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
    if (updatedMinusInitial.size === platformProviderIds.length) {
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
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.ReVerified:
        return {
          title: "Success!",
          body: `Successfully re-verified ${platform.platformId} data ${
            updatedVerifiedProviders.size > 1 ? "points" : "point"
          }.`,
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyVerified:
        return {
          title: "Success!",
          body: `Successfully verified ${platform.platformId} data ${
            updatedMinusInitial.size > 1 ? "points" : "point"
          }.`,
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.AllRemoved:
        return {
          title: "Success!",
          body: `All ${platform.platformId} data points removed.`,
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyRemoved:
        return {
          title: "Success!",
          body: `Successfully removed ${platform.platformId} data ${
            initialMinusUpdated.size > 1 ? "points" : "point"
          }.`,
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.PartiallyRemovedAndVerified:
        return {
          title: "Success!",
          body: `${initialMinusUpdated.size} ${platform.platformId} data ${
            initialMinusUpdated.size > 1 ? "points" : "point"
          } removed and ${updatedMinusInitial.size} verified.`,
          icon: success,
          platformId: platform.platformId as PLATFORM_ID,
        };
      case VerificationStatuses.Failed:
        return {
          title: "Verification Failed",
          body: "Please make sure you fulfill the requirements for this stamp.",
          icon: fail,
          platformId: platform.platformId as PLATFORM_ID,
        };
    }
  };

  const buttonText = useMemo(() => {
    const hasStamps = verifiedProviders.length > 0;

    if (isLoading) {
      if (hasStamps) {
        return "Saving...";
      }
      return "Verifying...";
    }

    if (submitted && !canSubmit) {
      return "Close";
    }

    if (hasStamps) {
      return "Save";
    }

    return "Verify";
  }, [isLoading, submitted, canSubmit, verifiedProviders.length]);

  return (
    <>
      <SideBarContent
        onClose={onClose}
        currentPlatform={platformScoreSpec}
        bannerConfig={platform.banner}
        currentProviders={platFormGroupSpec}
        verifiedProviders={verifiedProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={setSelectedProviders}
        isLoading={isLoading}
        verifyButton={
          <div className="px-4">
            <LoadButton
              className="button-verify mt-10 w-full"
              isLoading={isLoading}
              disabled={!submitted && !canSubmit}
              onClick={canSubmit ? handleFetchCredential : onClose}
              data-testid={`button-verify-${platform.platformId}`}
            >
              {buttonText}
            </LoadButton>
          </div>
        }
      />
      <JsonOutputModal
        isOpen={payloadModalIsOpen}
        onClose={() => setPayloadModalIsOpen(false)}
        title="Verification Response"
        subheading="To preserve your privacy, error information is not stored; please share with Gitcoin support at your discretion."
        jsonOutput={verificationResponse}
      />
      <NoStampModal isOpen={showNoStampModal} onClose={() => setShowNoStampModal(false)} />
    </>
  );
};
