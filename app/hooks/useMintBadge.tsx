// src/hooks/useMintBadge.ts
import { useState } from "react";
import { useAttestation } from "./useAttestation";
import { useScrollStampsStore } from "../context/scrollCampaignStore";
import { jsonRequest } from "../utils/AttestationProvider";
import { useMessage } from "./useMessage";
import { useNavigateToLastStep } from "./useNextCampaignStep";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { iamUrl } from "../config/stamp_config";
import { scrollCampaignChain } from "../config/scroll_campaign";
import { EasPayload } from "@gitcoin/passport-types";
import { ProviderWithTitle } from "../components/ScrollCampaign";

export const useMintBadge = () => {
  const { getNonce, issueAttestation } = useAttestation({ chain: scrollCampaignChain });
  const { credentials } = useScrollStampsStore();
  const { address } = useWeb3ModalAccount();
  const { failure } = useMessage();
  const goToLastStep = useNavigateToLastStep();

  const [syncingToChain, setSyncingToChain] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<ProviderWithTitle[]>([]);
  const [badgesFreshlyMinted, setBadgesFreshlyMinted] = useState(false);

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
        setSyncingToChain(false);
      } else {
        const url = `${iamUrl}v0.0.0/scroll/dev`;
        const { data }: { data: EasPayload } = await jsonRequest(url, {
          recipient: address || "",
          credentials: credentials,
          chainIdHex: scrollCampaignChain?.id,
          nonce,
        });

        if (data.error) {
          console.error("error syncing credentials to chain: ", data.error, "nonce:", nonce);
          failure({
            title: "Error",
            message: "An unexpected error occurred while generating attestations.",
          });
          setSyncingToChain(false);
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
      setSyncingToChain(false);
    }
  };

  return {
    onMint,
    syncingToChain,
    earnedBadges,
    badgesFreshlyMinted,
  };
};
