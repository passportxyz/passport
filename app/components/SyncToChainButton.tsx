import { Spinner } from "@chakra-ui/react";
import { OnChainStatus } from "../utils/onChainStatus";
import Tooltip from "../components/Tooltip";
import { Chain } from "../utils/chains";
import { useSyncToChainButton } from "../hooks/useSyncToChainButton";

export function getButtonMsg(onChainStatus: OnChainStatus): string {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Mint";
    case OnChainStatus.MOVED_OUT_OF_DATE:
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
  const { props, syncingToChain, needToSwitchChain, text } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  const loading = syncingToChain || onChainStatus === OnChainStatus.LOADING;

  return (
    <div className="flex justify-end">
      <button
        {...props}
        className={`center flex justify-center p-2 ${className} ${props.className} h-11 disabled:border-foreground-6`}
        data-testid="sync-to-chain-button"
      >
        <div className={`${loading ? "block" : "hidden"} relative top-1`}>
          <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
        </div>
        {needToSwitchChain && (
          <Tooltip className="px-0">You will be prompted to switch to {chain.label} and sign the transaction</Tooltip>
        )}
        <span
          className={`mx-1 translate-y-[1px] ${loading ? "hidden" : "block"} ${
            onChainStatus === OnChainStatus.MOVED_UP_TO_DATE || chain.attestationProvider?.status === "comingSoon"
              ? "text-foreground-6"
              : "text-foreground-2"
          }`}
        >
          {text}
        </span>
      </button>
    </div>
  );
}
