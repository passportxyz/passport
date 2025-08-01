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
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useAccount } from "wagmi";

export function getButtonMsg(onChainStatus: OnChainStatus): React.ReactElement {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return (
        <>
          <svg width="21" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15.6662 12.0009L7.2932 20.3739C6.89537 20.7718 6.3558 20.9953 5.7932 20.9953C5.23059 20.9953 4.69102 20.7718 4.2932 20.3739C3.89537 19.9761 3.67188 19.4365 3.67188 18.8739C3.67188 18.3113 3.89537 17.7718 4.2932 17.3739L12.6662 9.00094M18.6662 15.0009L22.6662 11.0009M22.1662 11.5009L20.2522 9.58694C19.8771 9.21195 19.6663 8.70333 19.6662 8.17294V7.00094L17.4062 4.74094C16.2907 3.62612 14.7812 2.9953 13.2042 2.98494L9.6662 2.96094L10.5862 3.78094C11.2397 4.36033 11.7629 5.07164 12.1214 5.86798C12.4799 6.66432 12.6656 7.52761 12.6662 8.40094V10.0009L14.6662 12.0009H15.8382C16.3686 12.0011 16.8772 12.2118 17.2522 12.5869L19.1662 14.5009"
              stroke="#0A0A0A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="pl-2 pt-1">Mint</span>
        </>
      );
    case OnChainStatus.MOVED_OUT_OF_DATE:
    case OnChainStatus.MOVED_EXPIRED:
      return (
        <>
          <svg width="20" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.33301 12C3.33301 9.61305 4.28122 7.32387 5.96905 5.63604C7.65687 3.94821 9.94606 3 12.333 3C14.8491 3.00947 17.264 3.99122 19.073 5.74L21.333 8M21.333 8V3M21.333 8H16.333M21.333 12C21.333 14.3869 20.3848 16.6761 18.697 18.364C17.0091 20.0518 14.72 21 12.333 21C9.81696 20.9905 7.40198 20.0088 5.59301 18.26L3.33301 16M3.33301 16H8.33301M3.33301 16V21"
              stroke="#0A0A0A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="pl-2 pt-1">Update</span>
        </>
      );
    case OnChainStatus.MOVED_UP_TO_DATE:
      return <>Minted</>;
    case OnChainStatus.LOADING:
      return <>Loading</>;
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
  const { rawScore, threshold, scoreState, refreshScore } = useContext(ScorerContext);
  const { dbAccessToken } = useDatastoreConnectionContext();
  const { address } = useAccount();
  const [showLowScoreAlert, setShowLowScoreAlert] = useState(false);

  const handleSyncSuccess = useCallback(() => {
    if (address && dbAccessToken) {
      // Add a 10-second delay before refreshing the score
      setTimeout(() => {
        refreshScore(address.toLowerCase(), dbAccessToken, true);
      }, 10000);
    }
  }, [address, dbAccessToken, refreshScore]);

  const { props, syncingToChain, needToSwitchChain } = useSyncToChainButton({
    chain,
    onChainStatus,
    onSuccess: handleSyncSuccess,
  });

  const isActive = chain?.attestationProvider?.status === "enabled";

  const buttonMsg = !isActive ? <>Coming Soon</> : getButtonMsg(onChainStatus);
  const buttonDisabled = !isActive;

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

  return (
    <>
      <button
        onClick={onSyncButtonClick}
        {...rest}
        className={`center flex justify-center items-center p-2 w-full h-8 rounded bg-white ${buttonDisabled ? "disabled cursor-not-allowed" : ""} ${className}`}
        data-testid="sync-to-chain-button"
      >
        <div className={`${loading ? "block" : "hidden"} relative top-1`}>
          <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
        </div>
        <span className={`mx-1 font-medium text-sm ${loading ? "hidden" : "flex items-center"} text-color-4`}>
          {buttonMsg}
        </span>
        {/* {needToSwitchChain && (
          <Tooltip className="" iconClassName="text-color-4">
            You will be prompted to switch to {chain.label} and sign the transaction
          </Tooltip>
        )} */}
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
