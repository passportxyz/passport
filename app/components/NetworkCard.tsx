import React from "react";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { useOnChainStatus } from "../hooks/useOnChainStatus";
import { OnChainStatus } from "../utils/onChainStatus";
import { useWalletStore } from "../context/walletStore";
import { useOnChainData } from "../hooks/useOnChainData";
import { Spinner } from "@chakra-ui/react";
import { Hyperlink } from "@gitcoin/passport-platforms";

const formatDate = (date: Date): string =>
  Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);

export function NetworkCard({ chain }: { chain: Chain }) {
  const status = useOnChainStatus({ chain });
  const { expirationDate } = useOnChainData().data[chain.id] || {};
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
      } ${expired ? "to-focus/25 border-focus text-focus" : "to-background-2/50 border-foreground-1 text-color-1"}
      mb-6 rounded-lg border p-2 align-middle`}
    >
      <div className="mx-4 my-2">
        <div className="flex items-center">
          <img className="h-10" src={chain.attestationProvider?.monochromeIcon} alt={`${chain.label} logo`} />
          <h1 className="ml-3 grow text-base font-heading">{chain.label}</h1>
          <SyncToChainButton onChainStatus={status} chain={chain} />
        </div>
        {isOnChain && (
          <div className="flex flex-row-reverse text-sm items-center mt-2">
            <div className={`text-right grow ${expired ? "text-inherit" : "text-color-6"} leading-tight`}>
              {expired ? (
                "Expired"
              ) : expirationDate ? (
                <>
                  Expires
                  <br />
                  {formatDate(expirationDate)}
                </>
              ) : (
                <Spinner size="sm" />
              )}
            </div>
            {address && chain.attestationProvider?.hasWebViewer && (
              <Hyperlink
                href={chain.attestationProvider?.viewerUrl(address) || ""}
                className={`font-alt leading-none w-[45%] ${expired ? "text-inherit" : ""}`}
              >
                {chain.attestationProvider?.attestationExplorerLinkText}
              </Hyperlink>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
