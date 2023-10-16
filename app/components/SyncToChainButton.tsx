import { Spinner } from "@chakra-ui/react";
import { OnChainStatus } from "../hooks/useOnChainStatus";
import Tooltip from "../components/Tooltip";
import { Chain } from "../utils/chains";
import { useSyncToChainButton } from "../hooks/useSyncToChainButton";

export function getButtonMsg(onChainStatus: OnChainStatus): string {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Go";
    case OnChainStatus.MOVED_OUT_OF_DATE:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Up to date";
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
  const { props, syncingToChain, needToSwitchChain, text } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  const loading = syncingToChain || onChainStatus === OnChainStatus.LOADING;

  return (
    <button
      {...props}
      className={`center flex w-full justify-center p-2 ${className} ${props.className}`}
      data-testid="sync-to-chain-button"
    >
      <div className={`${loading ? "block" : "hidden"} relative top-1`}>
        <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
      </div>
      <span
        className={`mx-1 translate-y-[1px] ${loading ? "hidden" : "block"} ${
          onChainStatus === OnChainStatus.MOVED_UP_TO_DATE ? "text-foreground-5" : "text-foreground-2"
        }`}
      >
        {text}
      </span>
      {needToSwitchChain && <Tooltip>You will be prompted to switch to {chain.label} and sign the transaction</Tooltip>}
    </button>
  );
}
