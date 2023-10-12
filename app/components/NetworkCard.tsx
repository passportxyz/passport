import React, { useContext } from "react";
import { OnChainContext } from "../context/onChainContext";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { useOnChainStatus } from "../hooks/useOnChainStatus";

export function NetworkCard({ chain }: { chain: Chain }) {
  const onChainStatus = useOnChainStatus({ chain });
  const { onChainLastUpdates } = useContext(OnChainContext);

  return (
    <div className="mb-6 rounded border border-foreground-6 bg-background-4 p-0 text-color-2">
      <div className="mx-4 my-2">
        <div className="flex w-full">
          <div className="mr-4 mt-1">
            <img className="max-h-6" src={chain.icon} alt={`${chain.label} logo`} />
          </div>
          <div>
            <div className="flex w-full flex-col">
              <h1 className="text-lg text-color-1">{chain.label}</h1>
              <h2 className="text-sm">{chain.attestationProvider?.name}</h2>
              <p className="mt-2 md:inline-block">
                {onChainLastUpdates[chain.id] ? onChainLastUpdates[chain.id].toLocaleString() : "Not moved yet"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <SyncToChainButton className="border-t border-foreground-6" onChainStatus={onChainStatus} chain={chain} />
    </div>
  );
}
