import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useNavigateToPage } from "../hooks/useCustomization";

export const useNextCampaignStep = () => {
  const { step, campaignId } = useParams();
  const navigateToPage = useNavigateToPage();

  const nextPage = useCallback(() => {
    const nextStep = parseInt(step || "0") + 1;
    navigateToPage(`campaign/${campaignId}/${nextStep}`);
  }, [navigateToPage, step, campaignId]);

  return nextPage;
};
