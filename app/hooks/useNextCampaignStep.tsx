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

export const useNavigateToRootStep = () => {
  const { campaignId } = useParams();
  const navigateToPage = useNavigateToPage();

  const rootPage = useCallback(() => {
    navigateToPage(`campaign/${campaignId}`);
  }, [navigateToPage, campaignId]);

  return rootPage;
};

export const useNavigateToLastStep = () => {
  const { campaignId } = useParams();
  const navigateToPage = useNavigateToPage();

  const rootPage = useCallback(() => {
    navigateToPage(`campaign/${campaignId}/3`);
  }, [navigateToPage, campaignId]);

  return rootPage;
};
