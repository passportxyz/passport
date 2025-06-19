import React from "react";
import { useAccount, useChainId, useChains, useEnsName } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { chains } from "../utils/chains";

export const CustomAccountWidget = () => {
  const { address, isConnected, connector, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const wagmiChains = useChains();
  const { open } = useAppKit();

  // Only fetch ENS name if on mainnet
  const { data: ensName } = useEnsName({
    address: address,
    enabled: isConnected && chainId === 1, // Only on mainnet
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
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 opacity-75"
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
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
      >
        <span className="text-sm font-medium text-gray-700">Connect Wallet</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      {/* Wallet Icon */}
      {connector?.icon && <img src={connector.icon} alt={connector.name || "Wallet"} className="w-5 h-5 rounded" />}

      {/* Chain Icon */}
      <img
        src={getChainIcon(chainId)}
        alt="Chain"
        className="w-5 h-5"
        onError={(e) => {
          // Fallback to Ethereum icon if chain icon fails to load
          (e.target as HTMLImageElement).src = "./assets/eth-network-logo.svg";
        }}
      />

      {/* Address or ENS name */}
      <span className={`text-sm font-medium text-gray-900 ${ensName ? "" : "font-mono"}`}>
        {ensName || formatAddress(address)}
      </span>

      {/* Dropdown Arrow */}
      <ChevronDownIcon className="w-5 h-5 text-gray-500 -ml-1" />
    </button>
  );
};
