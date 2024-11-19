import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";
import { ScrollCampaign } from "../components/ScrollCampaign";
import { useAccount } from "wagmi";
import { useDatastoreConnection } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";

const CAMPAIGN_MAP: Record<string, React.FC<{ step: number }>> = {
  "scroll-developer": ScrollCampaign,
};

const Campaign = () => {
  const { campaignId, step } = useParams();
  const stepNumber = parseInt(step || "") || 0;

  const { address } = useAccount();
  const { dbAccessTokenStatus } = useDatastoreConnection();
  const navigateToPage = useNavigateToPage();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!address || (dbAccessTokenStatus !== "connected" && stepNumber > 0)) {
      navigateToPage(`campaign/${campaignId}`);
    }
  }, [address, dbAccessTokenStatus]);

  if (campaignId && CAMPAIGN_MAP[campaignId]) {
    const ThisCampaign = CAMPAIGN_MAP[campaignId];
    return <ThisCampaign step={stepNumber} />;
  }

  return <NotFound />;
};

export default Campaign;
