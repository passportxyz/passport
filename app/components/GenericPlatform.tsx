// --- Methods
import React, { useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import {
  CredentialResponseBody,
  PROVIDER_ID,
  PLATFORM_ID,
  StampPatch,
  ValidResponseBody,
} from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "../utils/credentials";

// --- Style Components
import { StampDrawer } from "./StampDrawer";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";
import { LoadButton } from "./LoadButton";
import { JsonOutputModal } from "./JsonOutputModal";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { ScorerContext } from "../context/scorerContext";
import { waitForRedirect } from "../context/stampClaimingContext";

// --- Types
import { PlatformGroupSpec, PlatformPreCheckError } from "@gitcoin/passport-platforms";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";

// --- Helpers
import { difference, intersect, generateUID } from "../utils/helpers";

import { datadogRum } from "@datadog/browser-rum";
import { PlatformScoreSpec } from "../context/scorerContext";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import { useMessage } from "../hooks/useMessage";
import { useAccount, useSignMessage, useSendTransaction, useSwitchChain } from "wagmi";

export type PlatformProps = {
  platFormGroupSpec: PlatformGroupSpec[];
  platform: PlatformClass;
  isEVM?: boolean;
};

enum VerificationStatuses {
  AllVerified,
  ReVerified,
  PartiallyVerified,
  PartiallyRemovedAndVerified,
  Failed,
}

class InvalidSessionError extends Error {
  constructor() {
    super("Session is invalid");
    this.name = "InvalidSessionError";
  }
}

type GenericPlatformProps = PlatformProps & {
  isOpen: boolean;
  onClose: () => void;
  platformScoreSpec: PlatformScoreSpec;
};

const arraysContainSameElements = (a: any[], b: any[]) => {
  return a.length === b.length && a.every((v) => b.includes(v));
};

export const GenericPlatform = ({
  platFormGroupSpec,
  platform,
  platformScoreSpec,
  isOpen,
  onClose,
  isEVM,
}: GenericPlatformProps): JSX.Element => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { handlePatchStamps, verifiedProviderIds, userDid, expiredProviders } = useContext(CeramicContext);
  const { stampWeights, stampDedupStatus } = useContext(ScorerContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationResponse, setVerificationResponse] = useState<CredentialResponseBody[]>([]);
  const [payloadModalIsOpen, setPayloadModalIsOpen] = useState(false);
  const { checkSessionIsValid, dbAccessToken } = useDatastoreConnectionContext();
  const [verificationState, _setUserVerificationState] = useAtom(mutableUserVerificationAtom);

  const { success, failure, message } = useMessage();

  // find all providerIds (including deprecated - needed for tracking verified status)
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

  // Create Set to check initial verified providers
  const initialVerifiedProviders = new Set(verifiedProviders);
  const hasExpiredProviders = useMemo(() => {
    return intersect(new Set(expiredProviders), new Set(verifiedProviders)).size > 0;
  }, [verifiedProviders, expiredProviders]);

  // any time we change selection state...
  useEffect(() => {
    setCanSubmit(
      platformProviderIds.length > 0 &&
        (!arraysContainSameElements(platformProviderIds, verifiedProviders) || hasExpiredProviders)
    );
  }, [platformProviderIds, verifiedProviders, hasExpiredProviders]);

  const handleSponsorship = async (result: string): Promise<void> => {
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
  const handleFetchCredential = async (): Promise<void> => {
    datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
    setLoading(true);
    const selectedProviders = platformProviderIds;

    try {
      if (!address) throw new Error("No address found");

      const state = `${platform.path}-` + generateUID(10);
      const appContext = {
        state,
        window,
        screen,
        userDid,
        callbackUrl: window.location.origin,
        selectedProviders,
        waitForRedirect,
        // Add wagmi functions for EVM platforms
        ...(isEVM && {
          address,
          signMessageAsync,
          sendTransactionAsync,
          switchChainAsync,
        }),
      };

      const providerPayload = (await platform.getProviderPayload(appContext)) as {
        [k: string]: string;
      };

      if (providerPayload.sessionKey === "brightid") {
        handleSponsorship(providerPayload.code);
        return;
      }

      if (!checkSessionIsValid()) throw new InvalidSessionError();

      if (!dbAccessToken) {
        throw new Error("No database access token available - please sign in again");
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
        dbAccessToken
      );

      const verifiedCredentials =
        selectedProviders.length > 0
          ? verifyCredentialsResponse.credentials?.filter(
              (cred: any): cred is ValidResponseBody => !cred.error && cred.credential && cred.record
            ) || []
          : [];

      setVerificationResponse(verifyCredentialsResponse.credentials || []);

      // If the stamp was selected and can be claimed, return the {provider, credential} to add the stamp
      // If the stamp was not selected, return {provider} to delete the stamp
      // If the stamp was selected but cannot be claimed, return null to do nothing and
      //   therefore keep any existing valid stamp if it exists
      // If no verified credentials and we expected some, show an error
      // But still allow the code to continue to handlePatchStamps for keeping/deleting existing stamps
      if (verifiedCredentials.length === 0 && selectedProviders.length > 0) {
        const allCredentials = verifyCredentialsResponse.credentials || [];
        if (allCredentials.length > 0) {
          // There were credentials but they all had errors or were invalid
          const firstErrorResponse = allCredentials.find(
            (c: any) => c && typeof c === "object" && "error" in c && c.error && typeof c.error === "string"
          ) as { error: string } | undefined;
          if (firstErrorResponse?.error) {
            failure({
              title: "Verification Failed",
              message: firstErrorResponse.error,
              testId: platform.platformId,
            });
          } else {
            failure({
              title: "Verification Failed",
              message: "Unable to verify your stamp. Please check that you meet all requirements and try again.",
              testId: platform.platformId,
            });
          }
        } else {
          failure({
            title: "Verification Failed",
            message: "No verification response received. Please try again.",
            testId: platform.platformId,
          });
        }
      }

      const stampPatches = platformProviderIds
        .map((provider: PROVIDER_ID) => {
          const cred = verifiedCredentials.find((cred: any) => cred.record?.type === provider);
          if (cred) {
            return { provider, credential: cred.credential };
          } else if (expiredProviders.includes(provider)) {
            return { provider };
          } else {
            return null;
          }
        })
        .filter((patch): patch is StampPatch => Boolean(patch));

      await handlePatchStamps(stampPatches);

      datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
      // grab all providers who are verified from the verify response
      const actualVerifiedProviders = platformProviderIds.filter(
        (providerId: any) =>
          !!stampPatches.find((stampPatch) => stampPatch?.credential?.credentialSubject?.provider === providerId)
      );

      // `verifiedProviders` still holds the previously verified providers. If the user
      // can no longer claim the credential, but they still have a valid credential that
      // was previously verified, AND they had selected it, we want to keep it
      verifiedProviders.forEach((provider) => {
        if (
          !actualVerifiedProviders.includes(provider) &&
          selectedProviders.includes(provider) &&
          !expiredProviders.includes(provider)
        ) {
          actualVerifiedProviders.push(provider);
        }
      });

      // both verified and selected should look the same after save
      setVerifiedProviders([...actualVerifiedProviders]);

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

      message(
        getVerificationMessageParams(
          verificationStatus,
          updatedVerifiedProviders,
          initialMinusUpdated,
          updatedMinusInitial
        )
      );

      setLoading(false);
    } catch (e) {
      setLoading(false);
      if (e instanceof InvalidSessionError) {
        failure({
          title: "Session Invalid",
          message: "Please refresh the page to reset your session.",
          testId: platform.platformId,
        });
      } else if (e instanceof PlatformPreCheckError) {
        failure({
          title: "Verification Failed",
          message: e.message,
          testId: platform.platformId,
        });
      } else {
        console.error(e);
        datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
        failure({
          title: "Verification Failed",
          message: "There was an error verifying your stamp. Please try again.",
          testId: platform.platformId,
        });
      }
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
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
    } else if (updatedMinusInitial.size > 0 && initialMinusUpdated.size > 0) {
      return VerificationStatuses.PartiallyRemovedAndVerified;
    } else {
      return VerificationStatuses.Failed;
    }
  };

  const getVerificationMessageParams = (
    verificationStatus: VerificationStatuses,
    initialMinusUpdated: Set<PROVIDER_ID>,
    updatedMinusInitial: Set<PROVIDER_ID>,
    updatedVerifiedProviders: Set<PROVIDER_ID>
  ) => {
    // Switch statement to determine which toast message to display based on VerificationStatuses enum
    let title, message;
    const testId = platform.platformId as PLATFORM_ID;
    let status: "success" | "failure" = "success";

    switch (verificationStatus) {
      case VerificationStatuses.AllVerified:
        title = "Done!";
        message = `All ${platform.platformId} data points verified.`;
        break;
      case VerificationStatuses.ReVerified:
        title = "Success!";
        message = `Successfully re-verified ${platform.platformId} data ${
          updatedVerifiedProviders.size > 1 ? "points" : "point"
        }.`;
        break;
      case VerificationStatuses.PartiallyVerified:
        title = "Success!";
        message = `Successfully verified ${platform.platformId} data ${
          updatedMinusInitial.size > 1 ? "points" : "point"
        }.`;
        break;
      case VerificationStatuses.PartiallyRemovedAndVerified:
        title = "Success!";
        message = `${initialMinusUpdated.size} ${platform.platformId} data ${
          initialMinusUpdated.size > 1 ? "points" : "point"
        } removed and ${updatedMinusInitial.size} verified.`;
        break;
      case VerificationStatuses.Failed:
        title = "Verification Failed";
        status = "failure";
        message = "Please make sure you fulfill the requirements for this stamp.";
        break;
    }

    return {
      title,
      status,
      testId,
      message: (
        <>
          {message}
          <a className="cursor-pointer underline" onClick={() => setPayloadModalIsOpen(true)}>
            See Details
          </a>
        </>
      ),
    };
  };

  const isReverifying = useMemo(() => verificationState.loading && isEVM, [verificationState.loading, isEVM]);

  const buttonText = useMemo(() => {
    if (isReverifying) {
      return "Reverifying...";
    }

    if (isLoading) {
      return "Verifying...";
    }

    if (submitted && !canSubmit) {
      return "Close";
    }

    const hasStamps = verifiedProviders.length > 0;

    if (hasStamps && platformProviderIds.length === verifiedProviders.length && !hasExpiredProviders) {
      return (
        <>
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.55019 4.83333L4.31019 8.5L11.4502 1.5"
              stroke="#010101"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Verified
        </>
      );
    }

    return "Verify";
  }, [
    isReverifying,
    isLoading,
    submitted,
    canSubmit,
    verifiedProviders.length,
    platformProviderIds.length,
    hasExpiredProviders,
  ]);

  return (
    <>
      <StampDrawer
        isOpen={isOpen}
        onClose={onClose}
        platformSpec={platformScoreSpec}
        credentialGroups={platFormGroupSpec}
        onVerify={handleFetchCredential}
        verifiedProviders={verifiedProviders}
        expiredProviders={expiredProviders}
        stampWeights={stampWeights || {}}
        stampDedupStatus={stampDedupStatus || {}}
        isLoading={isLoading}
      />
      <JsonOutputModal
        isOpen={payloadModalIsOpen}
        onClose={() => setPayloadModalIsOpen(false)}
        title="Verification Response"
        subheading="To preserve your privacy, error information is not stored; please share with Human Passport support at your discretion."
        jsonOutput={verificationResponse}
      />
    </>
  );
};
