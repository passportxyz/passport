import React, { useEffect, useContext, useMemo, useState, useCallback } from "react";
import NotFound from "../pages/NotFound";
import PageRoot from "./PageRoot";
import { AccountCenter } from "./AccountCenter";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "./LoadButton";
import {
  useNextCampaignStep,
  useNavigateToRootStep,
  useNavigateToGithubConnectStep,
  useNavigateToLastStep,
} from "../hooks/useNextCampaignStep";
import { useScrollBadge } from "../hooks/useScrollBadge";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { EasPayload, PROVIDER_ID, Passport, Stamp } from "@gitcoin/passport-types";
import { useSetCustomizationKey } from "../hooks/useCustomization";
import { badgeContractInfo, scrollCampaignBadgeProviders, scrollCampaignChain } from "../config/scroll_campaign";

import { useMessage } from "../hooks/useMessage";
import { ScrollFooter, ScrollHeader } from "./scroll/ScrollLayout";
import { ScrollCampaignPage } from "./scroll/ScrollCampaignPage";
import { ScrollConnectGithub } from "./scroll/ScrollConnectGithub";
import { ScrollMintBadge } from "./scroll/ScrollMintPage";
import { useAttestation } from "../hooks/useAttestation";
import { iamUrl } from "../config/stamp_config";
import { useScrollStampsStore } from "../context/scrollCampaignStore";
import { jsonRequest } from "../utils/AttestationProvider";

interface Provider {
  name: PROVIDER_ID;
  image: string;
  level: number;
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

const ScrollMintingBadge = ({ earnedBadges }: { earnedBadges: ProviderWithTitle[] }) => {
  const { isConnected } = useWeb3ModalAccount();
  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      <div className="flex grow">
        <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2 text-center">
          <div className="text-5xl text-[#FFEEDA]">Minting badges!</div>
          <div className="flex flex-wrap justify-center items-end gap-8">
            {earnedBadges.map((badge, index) => (
              <div key={index} className={`flex flex-col items-center even:mb-10`}>
                <img
                  src={badge.image}
                  alt={`Badge Level ${badge.level}`}
                  className="badge-image w-32 h-32 object-contain"
                />
                <div className="mt-2 text-lg font-semibold">{badge.title}</div>
                <div className="text-sm">Level: {badge.level}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};

const ScrollMintedBadge = ({ badgesFreshlyMinted }: { badgesFreshlyMinted: boolean }) => {
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
          <div className="mb-10">
            {badgesFreshlyMinted ? (
              <div className="text-5xl text-[#FFEEDA]">Badges minted!</div>
            ) : (
              <div className="text-5xl text-[#FFEEDA]">You already minted available badges!</div>
            )}
            {badgesFreshlyMinted && (
              <p>
                See it{" "}
                <a
                  className="underline text-[#93FBED]"
                  href="https://scroll.io/canvas/mint"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                . Also do not forget to check the attestation{" "}
                <a
                  href={scrollCampaignChain?.attestationProvider?.viewerUrl(address!) ?? ""}
                  className="underline text-[#93FBED]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>
            )}
          </div>
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
            See badges on Canvas
          </LoadButton>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};

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
        if (provider && provider.level > highest.level) {
          return provider;
        }
        return highest;
      },
      { level: -1, name: "No Provider" as PROVIDER_ID, image: "" }
    );

    return {
      title: contract.title,
      ...highestLevelProvider,
    };
  });
};

export const ScrollCampaign = ({ step }: { step: number }) => {
  const setCustomizationKey = useSetCustomizationKey();
  const goToLoginStep = useNavigateToRootStep();
  const { address } = useWeb3ModalAccount();
  const { did, dbAccessToken } = useDatastoreConnectionContext();
  const { database } = useContext(CeramicContext);
  const { getNonce, issueAttestation } = useAttestation({ chain: scrollCampaignChain });
  const [syncingToChain, setSyncingToChain] = useState(false);
  const { credentials } = useScrollStampsStore();
  const { failure } = useMessage();
  const [earnedBadges, setEarnedBadges] = useState<ProviderWithTitle[]>([]);
  const [badgesFreshlyMinted, setBadgesFreshlyMinted] = useState(false);
  const goToLastStep = useNavigateToLastStep();

  useEffect(() => {
    setCustomizationKey("scroll");
  }, [setCustomizationKey]);

  useEffect(() => {
    if ((!dbAccessToken || !did || !database) && step > 0) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, step, goToLoginStep]);

  const [passport, setPassport] = useState<Passport | undefined>(undefined);

  const badgeStamps = useMemo(
    () => (passport ? passport.stamps.filter(({ provider }) => scrollCampaignBadgeProviders.includes(provider)) : []),
    [passport]
  );

  const deduplicatedBadgeStamps = useMemo(
    // TODO Deduplicate by seeing if in burnedHashes but not user's hashes
    () => badgeStamps.filter(({ provider }) => true),
    [badgeStamps]
  );

  const onMint = async (badges: ProviderWithTitle[]) => {
    try {
      setEarnedBadges(badges);
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
          credentials: credentials, // deduplicatedBadgeStamps.map(({ credential }) => credential),
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
          await issueAttestation({ data });
          setSyncingToChain(false);
          setBadgesFreshlyMinted(true);
          goToLastStep();
        }
      }
    } catch (error) {
      console.error("Error minting badge", error);
      failure({
        title: "Error",
        message: "An unexpected error occurred while trying to bring the data onchain.",
      });
    }
  };

  if (step === 0) {
    return <ScrollLogin />;
  } else if (step === 1) {
    return <ScrollConnectGithub />;
  } else if (step === 2) {
    if (syncingToChain) {
      return <ScrollMintingBadge earnedBadges={earnedBadges} />;
    }
    return <ScrollMintBadge onMintBadge={onMint} />;
  } else if (step === 3) {
    return <ScrollMintedBadge badgesFreshlyMinted={badgesFreshlyMinted} />;
  }
  return <NotFound />;
};
