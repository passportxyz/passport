import { useState } from "react";
import { useAttestation } from "./useAttestation";
import { jsonRequest } from "../utils/AttestationProvider";
import { useMessage } from "./useMessage";
import { useNavigateToLastStep } from "./useNextCampaignStep";
import { useAppKitAccount } from "@reown/appkit/react";
import { iamUrl } from "../config/stamp_config";
import { scrollCampaignChain } from "../config/scroll_campaign";
import { EasPayload, VerifiableCredential } from "@gitcoin/passport-types";

export const useMintBadge = () => {
  const { getNonce, issueAttestation } = useAttestation({ chain: scrollCampaignChain });
  const { address } = useAppKitAccount();
  const { failure } = useMessage();
  const goToLastStep = useNavigateToLastStep();

  const [syncingToChain, setSyncingToChain] = useState(false);
  const [badgesFreshlyMinted, setBadgesFreshlyMinted] = useState(false);

  const onMint = async ({ credentials }: { credentials: VerifiableCredential[] }) => {
    try {
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
          chainIdHex: scrollCampaignChain?.id,
          credentials,
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
    badgesFreshlyMinted,
  };
};
