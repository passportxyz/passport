import { Spinner } from "@chakra-ui/react";
import { OnChainStatus } from "../utils/onChainStatus";
import Tooltip from "../components/Tooltip";
import { Chain } from "../utils/chains";
import { useSyncToChainButton } from "../hooks/useSyncToChainButton";
import { useCallback, useContext, useState } from "react";
import { ScorerContext } from "../context/scorerContext";
import { LowScoreAlertModal } from "./LowScoreAlertModal";
import { atom, useAtom } from "jotai";
import { datadogLogs } from "@datadog/browser-logs";

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
  isLoading: boolean;
};

const userHasApprovedLowScoreMintAtom = atom<boolean>(false);

export function SyncToChainButton({ onChainStatus, chain, className, isLoading }: SyncToChainProps): JSX.Element {
  const [userHasApprovedLowScoreMint, setUserHasApprovedLowScoreMint] = useAtom(userHasApprovedLowScoreMintAtom);
  const { rawScore, threshold, scoreState } = useContext(ScorerContext);
  const [showLowScoreAlert, setShowLowScoreAlert] = useState(false);
  const { props, syncingToChain, needToSwitchChain, text } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  const { onClick, ...rest } = props;

  const onSyncButtonClick = useCallback(() => {
    if (rawScore < threshold && !userHasApprovedLowScoreMint) {
      setShowLowScoreAlert(true);
    } else {
      onClick();
    }
  }, [rawScore, threshold, onClick, userHasApprovedLowScoreMint]);

  const onCancelLowScoreAlert = useCallback(() => {
    datadogLogs.logger.info("User cancelled mint with low score");
    setShowLowScoreAlert(false);
  }, []);

  const onProceedLowScoreAlert = useCallback(() => {
    datadogLogs.logger.info("User approved mint with low score");
    setUserHasApprovedLowScoreMint(true);
    setShowLowScoreAlert(false);
    onClick();
  }, [onClick, setUserHasApprovedLowScoreMint]);

  const loading =
    isLoading ||
    showLowScoreAlert ||
    syncingToChain ||
    onChainStatus === OnChainStatus.LOADING ||
    scoreState.status === "loading";
  const expired = onChainStatus === OnChainStatus.MOVED_EXPIRED;

  return (
    <>
      <button
        onClick={onSyncButtonClick}
        {...rest}
        className={`center w-[98px] flex justify-center items-center p-2 ${className} ${props.className} h-11 rounded ${expired ? "bg-focus" : "disabled:bg-foreground-3 bg-foreground-2"}`}
        data-testid="sync-to-chain-button"
      >
        <div className={`${loading ? "block" : "hidden"} relative top-1`}>
          <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
        </div>
        {needToSwitchChain && (
          <Tooltip className="px-0" iconClassName="text-color-4">
            You will be prompted to switch to {chain.label} and sign the transaction
          </Tooltip>
        )}
        <span className={`mx-1 translate-y-[1px] font-alt font-medium ${loading ? "hidden" : "block"} text-color-4`}>
          {text}
        </span>
      </button>
      <LowScoreAlertModal
        isOpen={showLowScoreAlert}
        onProceed={onProceedLowScoreAlert}
        onCancel={onCancelLowScoreAlert}
        threshold={threshold}
      />
    </>
  );
}
