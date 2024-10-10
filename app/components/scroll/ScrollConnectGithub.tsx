import { useNavigateToLastStep, useNavigateToRootStep, useNextCampaignStep } from "../../hooks/useNextCampaignStep";
import { useDatastoreConnectionContext } from "../../context/datastoreConnectionContext";
import { useCallback, useContext, useEffect, useState } from "react";
import { CeramicContext } from "../../context/ceramicContext";
import { useWalletStore } from "../../context/walletStore";
import { useMessage } from "../../hooks/useMessage";
import { useScrollBadge } from "../../hooks/useScrollBadge";
import { CUSTOM_PLATFORM_TYPE_INFO } from "../../config/platformMap";
import { createSignedPayload, generateUID } from "../../utils/helpers";
import { scrollCampaignBadgeProviders } from "../../config/scroll_campaign";
import { waitForRedirect } from "../../context/stampClaimingContext";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../../config/stamp_config";
import { PROVIDER_ID, Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { datadogLogs } from "@datadog/browser-logs";
import { LoadButton } from "../LoadButton";
import { GitHubIcon } from "../WelcomeFooter";
import { ScrollCampaignPage } from "./ScrollCampaignPage";

export const ScrollConnectGithub = () => {
  const goToNextStep = useNextCampaignStep();
  const goToLastStep = useNavigateToLastStep();
  const { did, checkSessionIsValid } = useDatastoreConnectionContext();
  const { userDid, database } = useContext(CeramicContext);
  const goToLoginStep = useNavigateToRootStep();
  const address = useWalletStore((state) => state.address);
  const [noCredentialReceived, setNoCredentialReceived] = useState(false);
  const [msg, setMsg] = useState<string | undefined>("Verifying existing badges on chain ... ");
  const [isVerificationRunning, setIsVerificationRunning] = useState(false);
  const { failure } = useMessage();

  const { areBadgesLoading, hasAtLeastOneBadge } = useScrollBadge(address);

  useEffect(() => {
    // If the user already has on chain badge redirect to final step
    if (!areBadgesLoading && hasAtLeastOneBadge) {
      goToLastStep();
    } else {
      setMsg(undefined);
    }
  }, [areBadgesLoading, hasAtLeastOneBadge, goToLastStep]);

  const signInWithGithub = useCallback(async () => {
    setIsVerificationRunning(true);
    try {
      if (did) {
        const customGithubPlatform = new CUSTOM_PLATFORM_TYPE_INFO.DEVEL.platformClass(
          // @ts-ignore
          CUSTOM_PLATFORM_TYPE_INFO.DEVEL.platformParams
        );
        setMsg("Connecting to Github ...");
        const state = `${customGithubPlatform.path}-` + generateUID(10);
        const providerPayload = (await customGithubPlatform.getProviderPayload({
          state,
          window,
          screen,
          userDid,
          callbackUrl: window.location.origin,
          selectedProviders: scrollCampaignBadgeProviders,
          waitForRedirect,
        })) as {
          [k: string]: string;
        };

        if (!checkSessionIsValid()) {
          console.error(
            "It seems that the session is not valid any more (it might have timed out). Going back to login screen."
          );
          goToLoginStep();
        }

        setMsg("Please wait, we are checking your eligibility ...");
        const verifyCredentialsResponse = await fetchVerifiableCredential(
          iamUrl,
          {
            type: customGithubPlatform.platformId,
            types: scrollCampaignBadgeProviders,
            version: "0.0.0",
            address: address || "",
            proofs: providerPayload,
            signatureType: IAM_SIGNATURE_TYPE,
          },
          (data: any) => createSignedPayload(did, data)
        );

        setMsg(undefined);
        const verifiedCredentials =
          scrollCampaignBadgeProviders.length > 0
            ? verifyCredentialsResponse.credentials?.reduce((acc: VerifiableCredential[], cred: any) => {
                if (!cred.error) {
                  acc.push(cred.credential); // Accumulate only valid credentials
                }
                return acc;
              }, [] as VerifiableCredential[]) || []
            : [];

        if (verifiedCredentials.length > 0 && database) {
          const saveResult = await database.addStamps(
            verifiedCredentials.map(
              (credential): Stamp => ({ credential, provider: credential.credentialSubject.provider as PROVIDER_ID })
            )
          );

          if (saveResult.status !== "Success") {
            datadogLogs.logger.error("Error saving stamps to database: ", { address, saveResult });
            failure({
              title: "Error",
              message: "An unexpected error occurred while saving the credentials",
            });
          }

          goToNextStep();
        } else {
          setNoCredentialReceived(true);
        }
      }
    } finally {
      setIsVerificationRunning(false);
    }
  }, [did, address, checkSessionIsValid, goToLoginStep, goToNextStep, userDid, database, failure]);

  return (
    <ScrollCampaignPage>
      <div className="z-20 text-left">
        {noCredentialReceived ? (
          <>
            <div className="text-4xl text-[#FF684B]">We&apos;re sorry!</div>
            <div>You do not qualify because you do not have the minimum 10 contributions needed.</div>
          </>
        ) : (
          <>
            <div className="text-5xl text-[#FFEEDA]">Connect to Github</div>
            <div className="text-xl mt-2 max-w-4xl">
              Passport is privacy preserving and verifies you have 1 or more commits to the following Repos located
              here. Click below and obtain the specific developer credentials
            </div>
            <div className="mt-8 flex items-center justify-start">
              <LoadButton
                data-testid="connectGithubButton"
                variant="custom"
                onClick={signInWithGithub}
                isLoading={isVerificationRunning || areBadgesLoading}
                className="text-color-1 text-lg border-2 border-white hover:brightness-150 py-3 transition-all duration-200 pl-3 pr-5"
              >
                <GitHubIcon /> {msg ? msg : "Connect to Github"}
              </LoadButton>
            </div>
          </>
        )}
      </div>
      <div className="w-full">
        <div className="absolute inset-0 bg-black bg-opacity-70 w-full h-full -z-10"></div>
      </div>
    </ScrollCampaignPage>
  );
};
