import React, { useEffect, useContext, useMemo, useState } from "react";
import NotFound from "../pages/NotFound";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "./LoadButton";
import { useNextCampaignStep, useNavigateToRootStep, useNavigateToLastStep } from "../hooks/useNextCampaignStep";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { EasPayload, PROVIDER_ID, Passport, Stamp } from "@gitcoin/passport-types";
import { useSetCustomizationKey } from "../hooks/useCustomization";
import { scrollCampaignBadgeProviders, scrollCampaignChain } from "../config/scroll_campaign";

import { useMessage } from "../hooks/useMessage";
import { ScrollCampaignPage } from "./scroll/ScrollCampaignPage";
import { ScrollConnectGithub } from "./scroll/ScrollConnectGithub";
import { ScrollMintBadge } from "./scroll/ScrollMintPage";
import { useAttestation } from "../hooks/useAttestation";
import { iamUrl } from "../config/stamp_config";
import { useScrollStampsStore } from "../context/scrollCampaignStore";
import { jsonRequest } from "../utils/AttestationProvider";
import { ScrollMintingBadge } from "./scroll/ScrollMintingBadge";
import { ScrollMintedBadge } from "./scroll/ScrollMintedBadge";

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
