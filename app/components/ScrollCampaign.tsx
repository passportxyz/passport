import React, { useEffect, useContext, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import NotFound from "../pages/NotFound";
import PageRoot from "./PageRoot";
import { AccountCenter } from "./AccountCenter";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { useMessage } from "../hooks/useMessage";
import { LoadButton } from "./LoadButton";
import {
  useNextCampaignStep,
  useNavigateToRootStep,
  useNavigateToLastStep,
  useNavigateToGithubConnectStep,
} from "../hooks/useNextCampaignStep";
import { useScrollBadge } from "../hooks/useScrollBadge";
import { Badge1, Badge2, Badge3 } from "./campaign/scroll/badges";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { waitForRedirect } from "../context/stampClaimingContext";

import { useWalletStore } from "../context/walletStore";

import { CUSTOM_PLATFORM_TYPE_INFO } from "../config/platformMap";
import { PROVIDER_ID, Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { createSignedPayload, generateUID } from "../utils/helpers";
import { create } from "zustand";
import { GitHubIcon } from "./WelcomeFooter";
import { scrollCampaignBadgeProviders } from "../config/scroll_campaign";
import { PassportDatabase } from "@gitcoin/passport-database-client";
import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { datadogLogs } from "@datadog/browser-logs";

const SCROLL_STEP_NAMES = ["Connect Wallet", "Connect to Github", "Mint Badge"];
const SCROLL_CONTRACT_ADDRESSES = JSON.parse(process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_CONTRACT_ADDRESSES || "[]");

const scrollStampsStore = create<{
  credentials: VerifiableCredential[];
  setCredentials: (credentials: VerifiableCredential[]) => {};
}>((set) => ({
  credentials: [] as VerifiableCredential[],
  setCredentials: async (credentials: VerifiableCredential[]) => {
    set({ credentials });
  },
}));

// Use as hook
export const useScrollStampsStore = scrollStampsStore;

export const ScrollStepsBar = ({
  className,
  highLightCurrentStep = true,
}: {
  className?: string;
  highLightCurrentStep?: boolean;
}) => {
  const { step } = useParams();
  return (
    <div className={`flex flex-wrap gap-4 items-center ${className}`}>
      {SCROLL_STEP_NAMES.map((stepName, index) => (
        <div
          key={index}
          className={`flex items-center ${index === (parseInt(step || "") || 0) ? "" : "brightness-50"}`}
        >
          <div className="w-6 h-6 mr-2 rounded-full flex items-center shrink-0 justify-center text-center bg-[#FF684B]">
            {index + 1}
          </div>
          {stepName}
        </div>
      ))}
    </div>
  );
};

const ScrollHeader = ({ className }: { className?: string }) => {
  return (
    <div className={`mx-8 my-4 ${className}`}>
      <svg width="117" height="32" viewBox="0 0 117 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M44.4532 8.82754C42.2857 8.82754 40.5911 10.0886 40.5911 11.9014C40.5911 13.7142 42.0098 14.3054 43.7832 14.6601L46.0295 15.0147C48.9852 15.4876 51.0345 16.867 51.0345 20.0985C51.0345 23.4876 48.2759 25.4581 44.7291 25.4581C41.5369 25.4581 38.5419 23.5665 38.1084 19.9014C38.069 19.5862 38.3054 19.3103 38.6207 19.3103H39.9606C40.197 19.3103 40.4335 19.5073 40.4729 19.7438C40.7488 22.3448 42.7586 23.3694 44.7291 23.3694C46.8965 23.3694 48.5911 22.3054 48.5911 20.1379C48.5911 18.2069 47.2118 17.5369 45.399 17.1822L43.1921 16.7881C40.1182 16.2758 38.1872 14.7783 38.1872 11.9803C38.1872 8.70932 41.0246 6.69946 44.4532 6.69946C47.1724 6.69946 50.2069 8.23641 50.798 11.9014C50.8374 12.2167 50.601 12.4926 50.2857 12.4926H48.867C48.6305 12.4926 48.3941 12.2955 48.3547 12.0591C47.9606 9.73395 46.1872 8.82754 44.4532 8.82754Z"
          fill="white"
        />
        <path
          d="M59.8621 10.8374C63.1724 10.8374 65.4976 12.6108 66.3251 15.4876C66.404 15.8029 66.1675 16.1576 65.8128 16.1576H64.2759C64.0394 16.1576 63.8818 16 63.803 15.8029C63.2118 14.1477 61.9113 13.2413 59.8621 13.2413C57.1035 13.2413 55.5665 15.4876 55.5665 18.2069C55.5665 20.8867 57.1035 23.1724 59.8621 23.1724C61.8719 23.1724 63.2118 22.2266 63.803 20.6108C63.8818 20.4138 64.0788 20.2561 64.2759 20.2561H65.8128C66.1675 20.2561 66.404 20.5714 66.2857 20.9261C65.4187 23.9211 63.133 25.5763 59.8227 25.5763C55.5665 25.5763 52.8867 22.3054 52.8867 18.2463C52.9261 14.1477 55.6453 10.8374 59.8621 10.8374Z"
          fill="white"
        />
        <path
          d="M68.8473 23.133H72.1576V13.872H69.202C68.9261 13.872 68.6896 13.6355 68.6896 13.3596V12.0592C68.6896 11.7833 68.9261 11.5468 69.202 11.5468H73.2217C74.0493 11.5468 74.7586 12.2562 74.7586 13.0838V13.4385C75.5074 11.6651 77.0837 11.2316 79.5271 11.2316C80.4729 11.2316 81.1034 11.3892 81.4581 11.5074C81.6552 11.5862 81.7734 11.7833 81.7734 11.9803V13.3991C81.7734 13.7537 81.4581 13.9902 81.1034 13.872C80.6699 13.7143 80.0394 13.5961 79.2512 13.5961C76.6502 13.5961 74.798 15.3695 74.798 18.4828V23.133H79.0542C79.33 23.133 79.5665 23.3695 79.5665 23.6454V24.9459C79.5665 25.2217 79.33 25.4582 79.0542 25.4582H68.8473C68.5714 25.4582 68.335 25.2217 68.335 24.9459V23.6454C68.335 23.3695 68.5714 23.133 68.8473 23.133Z"
          fill="white"
        />
        <path
          d="M83.7438 18.1281C83.7438 14.1084 86.4236 10.7981 90.7586 10.7981C95.0936 10.7981 97.7734 14.069 97.7734 18.1281C97.7734 22.1479 95.0936 25.4582 90.7586 25.4582C86.3842 25.4582 83.7438 22.1873 83.7438 18.1281ZM90.7192 23.0937C93.5172 23.0937 95.0936 20.8474 95.0936 18.1281C95.0936 15.4483 93.4778 13.1626 90.7192 13.1626C87.9212 13.1626 86.3448 15.4089 86.3448 18.1281C86.3448 20.8474 87.9606 23.0937 90.7192 23.0937Z"
          fill="white"
        />
        <path
          d="M103.527 23.2513H107.547C107.823 23.2513 108.059 23.4877 108.059 23.7636V24.9853C108.059 25.2611 107.823 25.4976 107.547 25.4976H101.557C101.281 25.4976 101.044 25.2611 101.044 24.9853V9.14291H99.0345C98.7586 9.14291 98.5222 8.90646 98.5222 8.6306V7.40892C98.5222 7.13306 98.7586 6.89661 99.0345 6.89661H101.99C102.818 6.89661 103.527 7.60597 103.527 8.43355V23.2513Z"
          fill="white"
        />
        <path
          d="M112.394 23.2513H116.414C116.69 23.2513 116.926 23.4877 116.926 23.7636V24.9853C116.926 25.2611 116.69 25.4976 116.414 25.4976H110.424C110.148 25.4976 109.911 25.2611 109.911 24.9853V9.14291H107.901C107.626 9.14291 107.389 8.90646 107.389 8.6306V7.40892C107.389 7.13306 107.626 6.89661 107.901 6.89661H110.857C111.685 6.89661 112.394 7.60597 112.394 8.43355V23.2513Z"
          fill="white"
        />
        <path
          d="M4.05911 12.335C2.79803 11.1527 1.93103 9.61576 1.93103 7.80296V7.60591C2.04926 4.53202 4.57143 2.00985 7.64532 1.93103H27.3103C27.8227 1.97044 28.2167 2.32512 28.2167 2.83744V19.5074C28.6502 19.5862 28.8867 19.665 29.3202 19.7833C29.6749 19.9015 30.1478 20.1773 30.1478 20.1773V2.83744C30.1084 1.26108 28.8473 0 27.2709 0H7.64532C3.38916 0.0788177 0 3.5468 0 7.80296C0 10.2857 1.14286 12.4138 2.95567 13.8719C3.07389 13.9901 3.19212 14.1084 3.5468 14.1084C4.13793 14.1084 4.53202 13.6355 4.49261 13.1626C4.49261 12.7291 4.33498 12.5714 4.05911 12.335Z"
          fill="white"
        />
        <path
          d="M26.7981 20.6108H11.3892C10.3646 20.6108 9.53697 21.4384 9.53697 22.5024V24.7093C9.57638 25.7339 10.4434 26.6009 11.468 26.6009H12.6109V24.7093H11.468V22.5418C11.468 22.5418 11.7439 22.5418 12.0985 22.5418C14.0296 22.5418 15.4877 24.3546 15.4877 26.2857C15.4877 28.0196 13.9114 30.1871 11.3104 30.0295C8.98524 29.8719 7.72416 27.8226 7.72416 26.2857V7.48763C7.72416 6.66004 7.0148 5.95068 6.18721 5.95068H4.65027V7.88172H5.79313V26.3251C5.71431 30.0689 8.47293 31.9605 11.3104 31.9605L26.8375 31.9999C29.9508 31.9999 32.5123 29.4778 32.5123 26.3251C32.4729 23.133 29.9508 20.6108 26.7981 20.6108ZM30.5419 26.4039C30.4631 28.4137 28.8079 30.0295 26.7981 30.0295L16 29.9901C16.867 29.0049 17.3793 27.7044 17.3793 26.2857C17.3793 24.0788 16.0788 22.5418 16.0788 22.5418H26.8375C28.8867 22.5418 30.5813 24.2364 30.5813 26.2857L30.5419 26.4039Z"
          fill="white"
        />
        <path
          d="M22.6601 8.19703H11.0345V6.26599H22.6601C23.1724 6.26599 23.6059 6.69949 23.6059 7.2118C23.6059 7.76353 23.2118 8.19703 22.6601 8.19703Z"
          fill="white"
        />
        <path
          d="M22.6601 17.2611H11.0345V15.3301H22.6601C23.1724 15.3301 23.6059 15.7636 23.6059 16.2759C23.6059 16.8276 23.2118 17.2611 22.6601 17.2611Z"
          fill="white"
        />
        <path
          d="M24.7094 12.7291H11.0345V10.7981H24.7094C25.2217 10.7981 25.6552 11.2316 25.6552 11.7439C25.6552 12.2956 25.2217 12.7291 24.7094 12.7291Z"
          fill="white"
        />
      </svg>
    </div>
  );
};

const ScrollFooter = ({ className }: { className?: string }) => {
  return (
    <div
      className={`flex items-center justify-center drop-shadow-text md:justify-end mx-24 mb-12 text-color-1 text-alt ${className}`}
    >
      <div className="mr-3 hidden md:block">powered by</div>
      <img src="/assets/passportLogoWhite.svg" alt="Passport Logo" className="h-8 min-h-8 w-7 min-w-7" />
      <div className="font-body text-lg ml-1">Passport</div>
    </div>
  );
};

const ScrollCampaignPageRoot = ({ children }: { children: React.ReactNode }) => {
  const { isConnected } = useWeb3ModalAccount();
  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      {children}
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};

const ScrollCampaignPage = ({
  children,
  fadeBackgroundImage,
  emblemSrc,
}: {
  children: React.ReactNode;
  fadeBackgroundImage?: boolean;
  emblemSrc?: string;
}) => {
  return (
    <ScrollCampaignPageRoot>
      <div className="grow grid grid-cols-2 items-center justify-center">
        {emblemSrc && (
          <div className="hidden lg:flex col-start-2 row-start-1 justify-center xl:justify-start xl:ml-16 z-10 ml-2">
            <img src={emblemSrc} alt="Campaign Emblem" />
          </div>
        )}
        <div className="flex col-start-1 col-end-3 row-start-1">
          <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2">
            <div className="mt-24 mb-28 mx-8 lg:mr-1 lg:ml-8 flex flex-col items-start justify-center max-w-[572px]">
              <ScrollStepsBar className="mb-8" />
              {children}
            </div>
          </div>
          <div className="hidden lg:block relative overflow-hidden h-screen w-full max-w-[779px]">
            <img
              className={`absolute top-0 left-0 ${fadeBackgroundImage ? "opacity-50" : ""}`}
              src="/assets/campaignBackground.png"
              alt="Campaign Background Image"
            />
          </div>
        </div>
      </div>
    </ScrollCampaignPageRoot>
  );
};

const ScrollLogin = () => {
  const nextStep = useNextCampaignStep();
  const { isLoggingIn, signIn, loginStep } = useLoginFlow({ onLoggedIn: nextStep });

  return (
    <ScrollCampaignPage>
      <div className="text-5xl text-[#FFEEDA]">Developer Badge</div>
      <div className="text-xl mt-2">
        Connect your GitHub account to prove the number of contributions you have made, then mint your badge to prove
        you are a Rust developer.
      </div>
      <div className="mt-8">
        <LoadButton
          data-testid="connectWalletButton"
          variant="custom"
          onClick={signIn}
          isLoading={isLoggingIn}
          className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center">
            {isLoggingIn ? (
              <>
                <div>Connecting...</div>
                <div className="text-sm font-base">
                  (
                  {loginStep === "PENDING_WALLET_CONNECTION"
                    ? "Connect your wallet"
                    : loginStep === "PENDING_DATABASE_CONNECTION"
                      ? "Sign message in wallet"
                      : ""}
                  )
                </div>
              </>
            ) : (
              "Connect Wallet"
            )}
          </div>
        </LoadButton>
      </div>
    </ScrollCampaignPage>
  );
};

const ScrollConnectGithub = () => {
  const goToLoginStep = useNavigateToRootStep();
  const goToNextStep = useNextCampaignStep();
  const goToLastStep = useNavigateToLastStep();
  const { isConnected } = useWeb3ModalAccount();
  const { did, dbAccessToken, checkSessionIsValid } = useDatastoreConnectionContext();
  const { userDid, database } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);
  const { setCredentials } = useScrollStampsStore();
  const [noCredentialReceived, setNoCredentialReceieved] = useState(false);
  const [msg, setMsg] = useState<string | undefined>("Verifying existing badges on chain ... ");
  const [isVerificationRunning, setIsVerificationRunning] = useState(false);

  const { badges, areBadgesLoading, errors, hasAtLeastOneBadge } = useScrollBadge(
    address,
    SCROLL_CONTRACT_ADDRESSES,
    process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_RPC_URL as string
  );

  useEffect(() => {
    // If the user already has on chain badge redirect to final step
    if (hasAtLeastOneBadge) {
      goToLastStep();
    } else {
      setMsg(undefined);
    }
  }, [hasAtLeastOneBadge, badges, areBadgesLoading, errors, goToLastStep]);

  useEffect(() => {
    if (!dbAccessToken || !did) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, goToLoginStep]);

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

        setCredentials(verifiedCredentials);
        if (verifiedCredentials.length > 0) {
          goToNextStep();
        } else {
          setNoCredentialReceieved(true);
        }

        if (database) {
          const saveResult = await database.addStamps(
            verifiedCredentials.map(
              (credential): Stamp => ({ credential, provider: credential.credentialSubject.provider as PROVIDER_ID })
            )
          );

          if (saveResult.status !== "Success") {
            datadogLogs.logger.error("Error saving stamps to database: ", { address, saveResult });
          }
        }
      }
    } finally {
      setIsVerificationRunning(false);
    }
  }, [did, address, checkSessionIsValid, goToLoginStep, goToNextStep, setCredentials, userDid]);

  const msgSpan = msg ? <span className="pt-4">{msg}</span> : null;
  const body = noCredentialReceived ? (
    <>
      <div className="text-4xl text-[#FF684B]">We&apos;re sorry!</div>
      <div>You do not qualify because you do not have the minimum 10 contributions needed.</div>
    </>
  ) : (
    <>
      <div className="text-5xl text-[#FFEEDA]">Connect to Github</div>
      <div className="text-xl mt-2 max-w-4xl">
        Passport is privacy preserving and verifies you have 1 or more commits to the following Repos located here.
        Click below and obtain the specific developer credentials
      </div>
      <div className="mt-8 flex flex-col items-center justify-center">
        <LoadButton
          data-testid="connectGithubButton"
          variant="custom"
          onClick={signInWithGithub}
          isLoading={isVerificationRunning || areBadgesLoading}
          className="text-color-1 text-lg border-2 border-white hover:brightness-150 py-3 transition-all duration-200 pl-3 pr-5"
        >
          <GitHubIcon /> Connect to Github
        </LoadButton>
        {msgSpan}
      </div>
    </>
  );
  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      <div className="flex grow">
        <div className="flex flex-col min-h-screen items-center shrink-0 grow w-1/2 text-center">
          <ScrollStepsBar highLightCurrentStep={!noCredentialReceived} className="mb-8 pt-32 z-20" />
          <div className="z-20">{body}</div>
          <div className="max-w-[1440px] w-full">
            <div className="absolute inset-0 bg-black bg-opacity-70 w-full h-full -z-10"></div>
            <div className="grid grid-cols-3 pt-24 z-10">
              <div className="flex justify-center items-center">
                <Badge1 />
              </div>
              <div className="flex justify-center items-center">
                <Badge2 />
              </div>
              <div className="flex justify-center items-center">
                <Badge3 />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};

const ScrollMintedBadge = () => {
  const goToLoginStep = useNavigateToRootStep();
  const goToGithubConnectStep = useNavigateToGithubConnectStep();
  const { isConnected, address } = useWeb3ModalAccount();
  const { did, dbAccessToken, checkSessionIsValid } = useDatastoreConnectionContext();
  const { badges, areBadgesLoading, errors, hasAtLeastOneBadge } = useScrollBadge(
    address,
    SCROLL_CONTRACT_ADDRESSES,
    process.env.NEXT_PUBLIC_SCROLL_CAMPAIGN_RPC_URL as string
  );

  const { success, failure } = useMessage();

  useEffect(() => {
    if (!dbAccessToken || !did) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, goToLoginStep]);

  useEffect(() => {
    if (!hasAtLeastOneBadge) {
      goToGithubConnectStep();
    }
  });

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([key, value]) => {
        failure({
          title: `Error ${key}`,
          message: value,
        });
      });
    }
  }, [errors, failure]);

  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      <div className="flex grow">
        <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2 text-center">
          <div className="text-5xl text-[#FFEEDA]">You already minted available badges!</div>
          <div className="mb-8 ">Here are all your badges</div>
          {areBadgesLoading ? (
            <div>Loading badges...</div>
          ) : badges.length === 0 ? (
            <div>No badges found.</div>
          ) : (
            <div className="flex space-x-20">
              {badges.map((badge, index) =>
                badge.hasBadge ? (
                  <div key={index} className="border rounded p-5">
                    <img src={badge.badgeUri} alt={`Badge Level ${badge.badgeLevel}`} className="badge-image" />
                    <div className="mt-2 text-lg">Level: {badge.badgeLevel}</div>
                  </div>
                ) : null
              )}
            </div>
          )}
          <LoadButton
            data-testid="canvasRedirectButton"
            variant="custom"
            onClick={() => {
              window.open("https://scroll.io/canvas", "_blank", "noopener,noreferrer");
            }}
            className="text-color-1 text-lg border-2 border-white hover:brightness-150 py-3 transition-all duration-100 pl-3 pr-5 m-10"
          >
            See them on Canvas
          </LoadButton>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};

const ScrollMintBadge = () => {
  const nextStep = useNextCampaignStep();
  const { isLoggingIn, signIn, loginStep } = useLoginFlow({ onLoggedIn: nextStep });

  return (
    <ScrollCampaignPage fadeBackgroundImage emblemSrc="/assets/scrollCampaignMint.svg">
      <div className="text-5xl text-[#FFEEDA]">Developer Badge</div>
      <div className="text-xl mt-2">
        Connect your GitHub account to prove the number of contributions you have made, then mint your badge to prove
        you are a Rust developer.
      </div>
      <div className="mt-8">
        <LoadButton
          data-testid="connectWalletButton"
          variant="custom"
          onClick={signIn}
          isLoading={isLoggingIn}
          className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center">
            {isLoggingIn ? (
              <>
                <div>Connecting...</div>
                <div className="text-sm font-base">
                  (
                  {loginStep === "PENDING_WALLET_CONNECTION"
                    ? "Connect your wallet"
                    : loginStep === "PENDING_DATABASE_CONNECTION"
                      ? "Sign message in wallet"
                      : ""}
                  )
                </div>
              </>
            ) : (
              "Connect Wallet"
            )}
          </div>
        </LoadButton>
      </div>
    </ScrollCampaignPage>
  );
};

export const ScrollCampaign = ({ step }: { step: number }) => {
  if (step === 0) {
    return <ScrollLogin />;
  } else if (step === 1) {
    return <ScrollConnectGithub />;
  } else if (step === 2) {
    return <ScrollMintBadge />;
  } else if (step === 3) {
    return <ScrollMintedBadge />;
  }
  return <NotFound />;
};
