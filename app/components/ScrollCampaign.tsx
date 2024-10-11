import React, { useEffect, useContext, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import NotFound from "../pages/NotFound";
import PageRoot from "./PageRoot";
import { AccountCenter } from "./AccountCenter";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "./LoadButton";
import {
  useNextCampaignStep,
  useNavigateToRootStep,
  useNavigateToLastStep,
  useNavigateToGithubConnectStep,
} from "../hooks/useNextCampaignStep";
import { useScrollBadge } from "../hooks/useScrollBadge";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { waitForRedirect } from "../context/stampClaimingContext";

import { useWalletStore } from "../context/walletStore";

import { CUSTOM_PLATFORM_TYPE_INFO } from "../config/platformMap";
import { EasPayload, Passport, PROVIDER_ID, Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { createSignedPayload, generateUID } from "../utils/helpers";
import { GitHubIcon } from "./WelcomeFooter";
import { datadogLogs } from "@datadog/browser-logs";
import { useSetCustomizationKey } from "../hooks/useCustomization";
import { LoadingBarSection, LoadingBarSectionProps } from "./LoadingBar";
import {
  scrollCampaignBadgeProviders,
  scrollCampaignBadgeProviderInfo,
  scrollCampaignChain,
  badgeContractInfo,
} from "../config/scroll_campaign";
import { useAttestation } from "../hooks/useAttestation";
import { jsonRequest } from "../utils/AttestationProvider";
import { useMessage } from "../hooks/useMessage";
import { BackgroundImage, ScrollFooter, ScrollHeader, ScrollStepsBar } from "./scroll/ScrollLayout";
import { ScrollCampaignPage } from "./scroll/ScrollCampaignPage";
import { ScrollConnectGithub } from "./scroll/ScrollConnectGithub";
import { providers } from "@gitcoin/passport-platforms/*";
import { debug } from "console";

interface Provider {
  name: PROVIDER_ID;
  image: string;
  level: number;
}

interface BadgeContract {
  badgeContractAddress: string;
  title: string;
  providers: Provider[];
}

export interface ProviderWithTitle extends Provider {
  title: string;
}

interface TopBadges {
  title: string;
  level: number;
  image: string;
}

const getTopBadgesInfo = (): TopBadges[] => {
  return badgeContractInfo.map((item) => {
    const highestLevelProvider = item.providers.reduce((prev, current) =>
      prev.level > current.level ? prev : current
    );

    return {
      title: item.title,
      level: highestLevelProvider.level,
      image: highestLevelProvider.image,
    };
  });
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

export const getHighestEarnedBadgeProviderInfo = (contractAddress: string, level: number) => {
  const badgeContract = badgeContractInfo.find((contract) => contract.badgeContractAddress === contractAddress);
  if (badgeContract) {
    return badgeContract.providers.reduce<ProviderWithTitle>(
      (acc, provider) => {
        if (provider.level <= level && provider.level > acc.level) {
          acc = { title: badgeContract.title, ...provider };
        }
        return acc;
      },
      {
        title: "",
        name: "No Provider" as PROVIDER_ID,
        image: "",
        level: 0,
      }
    );
  }
};

const ScrollMintedBadge = () => {
  const goToLoginStep = useNavigateToRootStep();
  const goToGithubConnectStep = useNavigateToGithubConnectStep();
  const { isConnected, address } = useWeb3ModalAccount();
  const { did, dbAccessToken } = useDatastoreConnectionContext();
  const { badges, areBadgesLoading, errors, hasAtLeastOneBadge } = useScrollBadge(address);

  const { failure } = useMessage();

  useEffect(() => {
    if (!dbAccessToken || !did) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, goToLoginStep]);

  useEffect(() => {
    if (!areBadgesLoading && !hasAtLeastOneBadge) {
      goToGithubConnectStep();
    }
  }, [areBadgesLoading, hasAtLeastOneBadge, goToGithubConnectStep]);

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
          {areBadgesLoading ? (
            <div>Loading badges...</div>
          ) : badges.length === 0 ? (
            <div>No badges found.</div>
          ) : (
            <div className="flex flex-wrap justify-center items-end gap-8">
              {badges.map((badge, index) => {
                const badgeProviderInfo = getHighestEarnedBadgeProviderInfo(badge.contract, badge.badgeLevel);
                return badge.hasBadge && badgeProviderInfo ? (
                  <div key={index} className={`flex flex-col items-center even:mb-10`}>
                    <img
                      src={badgeProviderInfo?.image}
                      alt={`Badge Level ${badge.badgeLevel}`}
                      className="badge-image w-32 h-32 object-contain"
                    />
                    <div className="mt-2 text-lg font-semibold">{badgeProviderInfo.title}</div>
                    <div className="text-sm">Level: {badge.badgeLevel}</div>
                  </div>
                ) : (
                  <></>
                );
              })}
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

const ScrollLoadingBarSection = (props: LoadingBarSectionProps) => (
  <LoadingBarSection loadingBarClassName="h-10 via-[#FFEEDA] brightness-50" {...props} />
);

export const getEarnedBadges = (badgeStamps: Stamp[]): ProviderWithTitle[] => {
  if (badgeStamps.length === 0) {
    return [];
  }
  return badgeContractInfo.map((contract) => {
    const relevantStamps = badgeStamps.filter((stamp) =>
      contract.providers.some(({ name }) => name === stamp.provider)
    );

    if (relevantStamps.length === 0) {
      return {
        title: contract.title,
        name: "No Provider" as PROVIDER_ID,
        image: "",
        level: 0,
      };
    }

    const highestLevelProvider = relevantStamps.reduce(
      (highest, stamp) => {
        const provider = contract.providers.find(({ name }) => name === stamp.provider);
        console.log({ provider, highest });
        if (provider && provider.level > highest.level) {
          return provider;
        }
        return highest;
      },
      { level: -1, name: "No Provider" as PROVIDER_ID, image: "" }
    );
    console.log({ highestLevelProvider });

    return {
      title: contract.title,
      ...highestLevelProvider,
    };
  });
};

const ScrollMintBadge = () => {
  const { failure } = useMessage();
  const { database } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);
  const { getNonce, issueAttestation, needToSwitchChain } = useAttestation({ chain: scrollCampaignChain });
  const [syncingToChain, setSyncingToChain] = useState(false);

  const [passport, setPassport] = useState<Passport | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (database) {
        const passportLoadResponse = await database.getPassport();
        if (passportLoadResponse.status === "Success") {
          setPassport(passportLoadResponse.passport);
        } else {
          failure({
            title: "Error",
            message: "An unexpected error occurred while loading your Passport.",
          });
        }
      }
    })();
  }, [database]);

  const badgeStamps = useMemo(
    () => (passport ? passport.stamps.filter(({ provider }) => scrollCampaignBadgeProviders.includes(provider)) : []),
    [passport]
  );

  const loading = !passport;

  const deduplicatedBadgeStamps = useMemo(
    // TODO Deduplicate by seeing if in burnedHashes but not user's hashes
    () => badgeStamps.filter(({ provider }) => true),
    [badgeStamps]
  );

  const hasDeduplicatedCredentials = badgeStamps.length > deduplicatedBadgeStamps.length;

  const highestLevelBadgeStamps = useMemo(
    () =>
      Object.values(
        deduplicatedBadgeStamps.reduce(
          (acc, credential) => {
            const { contractAddress, level } = scrollCampaignBadgeProviderInfo[credential.provider];
            if (!acc[contractAddress] || level > acc[contractAddress].level) {
              acc[contractAddress] = { level, credential };
            }
            return acc;
          },
          {} as Record<string, { level: number; credential: Stamp }>
        )
      ).map(({ credential }) => credential),
    [badgeStamps, deduplicatedBadgeStamps]
  );

  const earnedBadges = getEarnedBadges(badgeStamps);
  console.log({ earnedBadges });

  const hasBadge = deduplicatedBadgeStamps.length > 0;
  const hasMultipleBadges = deduplicatedBadgeStamps.length > 1;

  const onMint = async () => {
    try {
      setSyncingToChain(true);

      const nonce = await getNonce();

      if (nonce === undefined) {
        failure({
          title: "Error",
          message: "An unexpected error occurred while trying to get the nonce.",
        });
      } else {
        const url = `${iamUrl}v0.0.0/scroll/dev`;
        const { data }: { data: EasPayload } = await jsonRequest(url, {
          recipient: address || "",
          credentials: deduplicatedBadgeStamps.map(({ credential }) => credential),
          chainIdHex: scrollCampaignChain?.id,
          nonce,
        });

        if (data.error) {
          console.error("error syncing credentials to chain: ", data.error, "nonce:", nonce);
          failure({
            title: "Error",
            message: "An unexpected error occurred while generating attestations.",
          });
        } else {
          issueAttestation({ data });
        }
      }
    } catch (error) {
      console.error("Error minting badge", error);
      failure({
        title: "Error",
        message: "An unexpected error occurred while trying to bring the data onchain.",
      });
    }
    setSyncingToChain(false);
  };

  return (
    <ScrollCampaignPage fadeBackgroundImage={loading || hasBadge} earnedBadges={earnedBadges}>
      <ScrollLoadingBarSection
        isLoading={loading}
        className={`text-5xl ${hasBadge ? "text-[#FFEEDA]" : "text-[#FF684B]"}`}
      >
        {hasBadge ? "Congratulations!" : "We're sorry!"}
      </ScrollLoadingBarSection>
      <ScrollLoadingBarSection isLoading={loading} className="text-xl mt-2">
        {hasBadge ? (
          <div>
            You qualify for {deduplicatedBadgeStamps.length} badge{hasMultipleBadges ? "s" : ""}. Mint your badge
            {hasMultipleBadges ? "s" : ""} and get a chance to work with us.
            {hasDeduplicatedCredentials
              ? " (Some badge credentials could not be validated because they have already been claimed on another address.)"
              : ""}
          </div>
        ) : hasDeduplicatedCredentials ? (
          "Your badge credentials have already been claimed with another address."
        ) : (
          "You don't qualify for any badges."
        )}
      </ScrollLoadingBarSection>

      {hasBadge && (
        <div className="mt-8">
          <LoadButton
            variant="custom"
            onClick={onMint}
            isLoading={loading || syncingToChain}
            className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">
              {syncingToChain ? "Minting..." : "Mint Badge"}
            </div>
          </LoadButton>
          {needToSwitchChain && (
            <div className="text-[#FF684B] mt-4">
              You will be prompted to switch to the Scroll chain, and then to submit a transaction.
            </div>
          )}
        </div>
      )}
    </ScrollCampaignPage>
  );
};

export const ScrollCampaign = ({ step }: { step: number }) => {
  const { did, dbAccessToken } = useDatastoreConnectionContext();
  const { database } = useContext(CeramicContext);
  const { address } = useWeb3ModalAccount();
  const goToLoginStep = useNavigateToRootStep();
  const setCustomizationKey = useSetCustomizationKey();

  useEffect(() => {
    setCustomizationKey("scroll");
  }, [setCustomizationKey]);

  useEffect(() => {
    if ((!dbAccessToken || !did || !database) && step > 0) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, step, goToLoginStep]);

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
