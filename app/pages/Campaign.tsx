import React, { useCallback } from "react";
import { useParams } from "react-router-dom";
import { NotFound } from "./NotFound";
import { useNavigateToPage } from "../hooks/useCustomization";
import PageRoot from "../components/PageRoot";
import { AccountCenter } from "../components/AccountCenter";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "../components/LoadButton";

const BackgroundImage = ({ className }: { className?: string }) => {
  return;
};

const ShapeLogin = () => {
  const nextStep = useNextCampaignStep();

  const { isConnected } = useWeb3ModalAccount();
  const { isLoggingIn, signIn, loginStep } = useLoginFlow();

  return (
    <PageRoot className="flex">
      <div className="flex flex-col min-h-screen shrink-0 grow w-1/2">
        {isConnected && <AccountCenter />}
        <div>Header</div>
        <div className="flex-grow flex flex-col items-center justify-center">Body</div>
        <div>Footer</div>
      </div>
      <div className="hidden lg:block shrink relative overflow-hidden h-screen w-full max-w-[779px]">
        <img
          className="h-[1024px] w-[779px] min-h-[1024px] min-w-[779px] absolute top-0 left-0"
          src="/assets/campaignBackgroundCutoff.png"
          alt="Campaign Background Image"
        />
      </div>
    </PageRoot>
  );
};

// TODO
const ShapeConnectGithub = () => {
  return <div>Shape Connect Github</div>;
};

const ShapeCampaign = ({ step }: { step: number }) => {
  if (step === 0) {
    return <ShapeLogin />;
  } else if (step === 1) {
    return <ShapeConnectGithub />;
  }

  return <NotFound />;
};

export const useNextCampaignStep = () => {
  const { step, campaignId } = useParams();
  const navigateToPage = useNavigateToPage();

  const nextPage = useCallback(() => {
    const nextStep = parseInt(step || "0") + 1;
    navigateToPage(`campaign/${campaignId}/${nextStep}`);
  }, [navigateToPage, step, campaignId]);

  return nextPage;
};

const CAMPAIGN_MAP: Record<string, React.FC<{ step: number }>> = {
  shape: ShapeCampaign,
};

export const Campaign = () => {
  const { campaignId, step } = useParams();

  // TODO
  console.log("evaluating");

  const stepNumber = parseInt(step || "") || 0;

  if (campaignId && CAMPAIGN_MAP[campaignId]) {
    const ThisCampaign = CAMPAIGN_MAP[campaignId];
    return <ThisCampaign step={stepNumber} />;
  }

  return <NotFound />;
};
