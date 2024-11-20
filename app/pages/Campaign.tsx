import React from "react";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { ScrollCampaign } from "../components/ScrollCampaign";

const CAMPAIGN_MAP: Record<string, React.FC<{ step: number }>> = {
  "scroll-developer": ScrollCampaign,
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
