import React from "react";
import { useAccount, useChainId, useEnsName } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { chains } from "../utils/chains";
import { useBreakpoint } from "../hooks/useBreakpoint";

export const CustomAccountWidget = () => {
  const isLg = useBreakpoint("lg");
  const { address, isConnected, connector, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { open } = useAppKit();

  const { data: ensName } = useEnsName({
    address: address,
  });

  // Format address: 0x1234...567
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-3)}`;
  };

  // Get chain icon from our chains config
  const getChainIcon = (id: number) => {
    const hexChainId = `0x${id.toString(16)}` as const;
    const chain = chains.find((c) => c.id === hexChainId);
    return chain?.icon || "./assets/eth-network-logo.svg";
  };

  // Handle loading states
  if (isConnecting || isReconnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm border-1 border-gray-200 opacity-75"
      >
        <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
        <span className="text-sm font-medium text-gray-500">Connecting...</span>
      </button>
    );
  }

  // Handle disconnected state
  if (!isConnected || !address) {
    return (
      <button
        onClick={() => open()}
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-1 border-gray-200"
      >
        <span className="text-sm font-medium text-gray-700">Connect Wallet</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="flex items-center gap-2 pl-0 py-0 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-1 border-gray-200"
    >
      {/* Wallet Icon with light blue background */}
      <div className="bg-blue-100 px-3 py-2 flex items-center justify-center rounded-none lg:rounded-lg">
        {connector?.icon ? (
          <img src={connector.icon} alt={connector.name || "Wallet"} className="w-5 h-5" />
        ) : (
          <div className="w-5 h-5 bg-gray-300 rounded" />
        )}
      </div>

      {isLg && (
        <>
          {/* Chain Icon with gray circle background */}
          <div className="bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            <img
              src={getChainIcon(chainId)}
              alt="Chain"
              className="w-3.5 h-3.5"
              onError={(e) => {
                // Fallback to Ethereum icon if chain icon fails to load
                (e.target as HTMLImageElement).src = "./assets/eth-network-logo.svg";
              }}
            />
          </div>

          {/* Address or ENS name */}
          <span className="text-sm font-semibold text-gray-900">{ensName || formatAddress(address)}</span>

          {/* Dropdown Arrow */}
          <ChevronDownIcon className="w-4 h-4 pr-2 text-gray-500" />
        </>
      )}
    </button>
  );
};
