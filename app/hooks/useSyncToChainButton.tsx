import { EasPayload, VerifiableCredential, EasRequestBody, Passport } from "@gitcoin/passport-types";
import { useCallback, useContext, useMemo, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { OnChainStatus } from "../utils/onChainStatus";
import { Chain } from "../utils/chains";
import { useMessage } from "./useMessage";
import { useCustomization } from "./useCustomization";
import { useIssueAttestation, useAttestationNonce } from "./useIssueAttestation";
import { useAccount } from "wagmi";

export const useSyncToChainButton = ({
  chain,
  onChainStatus,
  getButtonMsg,
}: {
  chain?: Chain;
  onChainStatus: OnChainStatus;
  getButtonMsg: (onChainStatus: OnChainStatus) => string;
}) => {
  const { failure } = useMessage();

  const { passport } = useContext(CeramicContext);
  const { address } = useAccount();
  const customization = useCustomization();
  const { nonce, isLoading, isError } = useAttestationNonce({ chain });
  const { issueAttestation, needToSwitchChain } = useIssueAttestation({ chain });

  const [syncingToChain, setSyncingToChain] = useState(false);

  const customScorerId = useMemo(
    () => (customization.scorer?.id && chain?.useCustomCommunityId ? customization.scorer.id : undefined),
    [chain?.useCustomCommunityId, customization?.scorer?.id]
  );

  const onInitiateSyncToChain = useCallback(
    async (passport: Passport | undefined | false) => {
      if (passport && chain && chain.attestationProvider && !syncingToChain && address && !isLoading && !isError) {
        try {
          setSyncingToChain(true);
          const credentials = passport.stamps.map(({ credential }: { credential: VerifiableCredential }) => credential);

          if (credentials.length === 0) {
            // Nothing to be brought onchain
            failure({
              title: "Error",
              message: "You do not have any Stamps to bring onchain.",
            });
            return;
          }

          if (nonce === undefined) {
            console.log("Unable to load nonce");
            return;
          }

          const payload: EasRequestBody = {
            recipient: address || "",
            credentials,
            nonce,
            chainIdHex: chain.id,
            customScorerId,
          };

          const { data }: { data: EasPayload } = await chain.attestationProvider.getMultiAttestationRequest(payload);

          if (data.error) {
            console.error(
              "error syncing credentials to chain: ",
              data.error,
              "credentials: ",
              credentials,
              "nonce:",
              nonce
            );
          }

          if (data.invalidCredentials.length > 0) {
            // This can only happen when trying to bring the entire passport onchain
            // This cannot happen when we only bring the score onchain
            // TODO: maybe we should prompt the user if he wants to continue? Maybe he wants to refresh his attestations first?
            console.log("not syncing invalid credentials (invalid credentials): ", data.invalidCredentials);
          }

          await issueAttestation({ data });
        } catch (e) {
          console.error("error syncing credentials to chain: ", e);
          failure({
            title: "Error",
            message: "An unexpected error occurred while trying to bring the data onchain.",
          });
        } finally {
          setSyncingToChain(false);
        }
      }
    },
    [chain, address, syncingToChain, issueAttestation, failure, customScorerId]
  );

  const isActive = chain?.attestationProvider?.status === "enabled";
  const disableBtn = !isActive || onChainStatus === OnChainStatus.MOVED_UP_TO_DATE;

  const onClick = () => onInitiateSyncToChain(passport);

  const className = disableBtn ? "cursor-not-allowed" : "";
  const disabled = disableBtn;

  const text = isActive ? getButtonMsg(onChainStatus) : "Coming Soon";

  return {
    syncingToChain,
    needToSwitchChain: isActive && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE && needToSwitchChain,
    text,
    props: {
      onClick,
      className,
      disabled,
    },
  };
};
