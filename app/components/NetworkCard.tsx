import React, { useContext } from "react";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { OnChainStatus, useOnChainStatus } from "../hooks/useOnChainStatus";
import { UserContext } from "../context/userContext";

export function NetworkCard({ chain }: { chain: Chain }) {
  const onChainStatus = useOnChainStatus({ chain });
  const { address } = useContext(UserContext);

  const isOnChain =
    onChainStatus === OnChainStatus.MOVED_OUT_OF_DATE || onChainStatus === OnChainStatus.MOVED_UP_TO_DATE;
  return (
    <div
      className={`${
        chain?.attestationProvider?.status === "enabled" &&
        "bg-background-4 bg-gradient-to-b from-background to-[#06153D]"
      } mb-6 rounded border border-foreground-6  p-2 align-middle text-color-2`}
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
                  className="pt-2 text-sm text-foreground-2 underline"
                >
                  Check attestation on EAS
                </a>
              )}
              <h2 className="my-3 pt-2 text-right text-base text-color-1">Moved</h2>
            </>
          )}
          <SyncToChainButton
            className="inline-block rounded border border-foreground-2"
            onChainStatus={onChainStatus}
            chain={chain}
          />
        </div>
      </div>
    </div>
  );
}
