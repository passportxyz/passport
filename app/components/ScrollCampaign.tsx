import React, { useEffect, useContext } from "react";
import NotFound from "../pages/NotFound";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "./LoadButton";
import { useNextCampaignStep, useNavigateToRootStep } from "../hooks/useNextCampaignStep";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useSetCustomizationKey } from "../hooks/useCustomization";
import { ScrollCampaignPage } from "./scroll/ScrollCampaignPage";
import { ScrollConnectGithub } from "./scroll/ScrollConnectGithub";
import { ScrollMintBadge } from "./scroll/ScrollMintPage";
import { ScrollMintedBadge } from "./scroll/ScrollMintedBadge";
import { useMintBadge } from "../hooks/useMintBadge";

interface Provider {
  name: PROVIDER_ID;
  image: string;
  level: number;
}

export interface ProviderWithTitle extends Provider {
  title: string;
}

export const BadgeCTA = ({ header, body }: { header: string; body: string }) => (
  <>
    <div className="text-3xl lg:text-5xl text-[#FFEEDA]">{header}</div>
    <div className="text-lg lg:text-xl text-[#FFEEDA] mt-2">{body}</div>
  </>
);

const ScrollLogin = () => {
  const nextStep = useNextCampaignStep();
  const { isLoggingIn, signIn, loginStep } = useLoginFlow({ onLoggedIn: nextStep });

  return (
    <ScrollCampaignPage>
      <BadgeCTA
        header="Developer Badge"
        body="Connect your GitHub account to prove the number of contributions you have made, then mint your badge to prove
        you are a ZK developer."
      />
      <div className="mt-8 w-full lg:w-auto">
        <LoadButton
          data-testid="connectWalletButton"
          variant="custom"
          onClick={signIn}
          isLoading={isLoggingIn}
          className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200 w-full"
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
  const { did, dbAccessToken } = useDatastoreConnectionContext();
  const { database } = useContext(CeramicContext);

  const { onMint, syncingToChain, badgesFreshlyMinted } = useMintBadge();

  useEffect(() => {
    setCustomizationKey("scroll");
  }, [setCustomizationKey]);

  useEffect(() => {
    if ((!dbAccessToken || !did || !database) && step > 0) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, step, goToLoginStep, database]);

  if (step === 0) {
    return <ScrollLogin />;
  } else if (step === 1) {
    return <ScrollConnectGithub />;
  } else if (step === 2) {
    return <ScrollMintBadge onMint={onMint} syncingToChain={syncingToChain} />;
  } else if (step === 3) {
    return <ScrollMintedBadge badgesFreshlyMinted={badgesFreshlyMinted} />;
  }
  return <NotFound />;
};
