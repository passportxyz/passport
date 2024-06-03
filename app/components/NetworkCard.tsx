import React from "react";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { useOnChainState } from "../hooks/useOnChainStatus";
import { OnChainStatus } from "../utils/onChainStatus";
import { useWalletStore } from "../context/walletStore";

const formatDate = (date: Date): string =>
  Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);

export function NetworkCard({ chain }: { chain: Chain }) {
  // TODO
  const expirationDate = new Date("1/1/2024");
  const { status } = useOnChainState({ chain });
  const address = useWalletStore((state) => state.address);

  const isOnChain = [
    OnChainStatus.MOVED_OUT_OF_DATE,
    OnChainStatus.MOVED_UP_TO_DATE,
    OnChainStatus.MOVED_EXPIRED,
  ].includes(status);

  const expired = status === OnChainStatus.MOVED_EXPIRED;

  return (
    <div
      className={`${
        chain?.attestationProvider?.status === "enabled" && "bg-gradient-to-b from-background"
      } ${expired ? "to-focus/25 border-focus text-focus" : "to-background-2/50 border-foreground-6 text-color-2"}
      mb-6 rounded border p-2 align-middle`}
    >
      <div className="mx-4 my-2">
        <div className={`${isOnChain ? "grid-rows-2" : "grid-rows-1"} grid grid-flow-col  gap-4 space-y-2`}>
          <div className="flex items-center">
            <img className="h-10" src={chain.icon} alt={`${chain.label} logo`} />
            <h1 className="ml-3 text-xl">{chain.label}</h1>
          </div>
          {isOnChain && (
            <>
              {address && (
                <a
                  href={chain.attestationProvider?.viewerUrl(address)}
                  className={`pt-2 text-sm ${expired ? "text-inherit" : "text-foreground-2"} underline`}
                >
                  {chain.attestationProvider?.attestationExplorerLinkText}
                </a>
              )}
              <div
                className={`my-3 pt-2 text-right text-base ${expired ? "text-inherit" : "text-color-1"} leading-tight`}
              >
                {expired ? (
                  "Expired"
                ) : (
                  <>
                    Expires
                    <br />
                    {formatDate(expirationDate)}
                  </>
                )}
              </div>
            </>
          )}
          <SyncToChainButton className="justify-self-end" onChainStatus={status} chain={chain} />
        </div>
      </div>
    </div>
  );
}
