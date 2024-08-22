import { Spinner } from "@chakra-ui/react";
import { OnChainStatus } from "../utils/onChainStatus";
import Tooltip from "../components/Tooltip";
import { Chain } from "../utils/chains";
import { useSyncToChainButton } from "../hooks/useSyncToChainButton";
import { useCallback, useContext, useState } from "react";
import { ScorerContext } from "../context/scorerContext";
import { LowScoreAlertModal } from "./LowScoreAlertModal";

export function getButtonMsg(onChainStatus: OnChainStatus): string {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Mint";
    case OnChainStatus.MOVED_OUT_OF_DATE:
    case OnChainStatus.MOVED_EXPIRED:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Minted";
    case OnChainStatus.LOADING:
      return "Loading";
  }
}

export type SyncToChainProps = {
  onChainStatus: OnChainStatus;
  chain: Chain;
  className?: string;
};

export function SyncToChainButton({ onChainStatus, chain, className }: SyncToChainProps): JSX.Element {
  const { score } = useContext(ScorerContext);
  const [showLowScoreAlert, setShowLowScoreAlert] = useState(false);
  const { props, syncingToChain, needToSwitchChain, text } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  const { onClick, ...rest } = props;

  const onSyncButtonClick = useCallback(() => {
    if (score < 20) {
      setShowLowScoreAlert(true);
    } else {
      onClick();
    }
  }, [score, onClick]);

  const onCloseLowScoreAlert = useCallback(() => {
    setShowLowScoreAlert(false);
  }, []);

  const onProceedLowScoreAlert = useCallback(() => {
    onCloseLowScoreAlert();
    onClick();
  }, [onClick]);

  const loading = showLowScoreAlert || syncingToChain || onChainStatus === OnChainStatus.LOADING;
  const expired = onChainStatus === OnChainStatus.MOVED_EXPIRED;

  return (
    <>
      <button
        onClick={onSyncButtonClick}
        {...rest}
        className={`center flex justify-center items-center p-2 ${className} ${props.className} h-11 w-fit rounded border ${expired ? "border-focus" : "disabled:border-foreground-6 border-foreground-2"}`}
        data-testid="sync-to-chain-button"
      >
        <div className={`${loading ? "block" : "hidden"} relative top-1`}>
          <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
        </div>
        {needToSwitchChain && (
          <Tooltip className="px-0" iconClassName={expired ? "text-focus" : ""}>
            You will be prompted to switch to {chain.label} and sign the transaction
          </Tooltip>
        )}
        <span
          className={`mx-1 translate-y-[1px] ${loading ? "hidden" : "block"} ${
            expired
              ? "text-focus"
              : onChainStatus === OnChainStatus.MOVED_UP_TO_DATE || chain.attestationProvider?.status === "comingSoon"
                ? "text-foreground-6"
                : "text-foreground-2"
          }`}
        >
          {text}
        </span>
      </button>
      <LowScoreAlertModal
        isOpen={showLowScoreAlert}
        onProceed={onProceedLowScoreAlert}
        onCancel={onCloseLowScoreAlert}
      />
    </>
  );
}
