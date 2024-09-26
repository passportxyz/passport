import React, { useCallback } from "react";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { useNavigateToPage } from "../hooks/useCustomization";
import { ScrollCampaign } from "../components/ScrollCampaign";

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
  scroll: ScrollCampaign,
};

const Campaign = () => {
  const { campaignId, step } = useParams();

  const stepNumber = parseInt(step || "") || 0;

  if (campaignId && CAMPAIGN_MAP[campaignId]) {
    const ThisCampaign = CAMPAIGN_MAP[campaignId];
    return <ThisCampaign step={stepNumber} />;
  }

  return <NotFound />;
};

export default Campaign;
