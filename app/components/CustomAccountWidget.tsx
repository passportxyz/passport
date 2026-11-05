import React, { useEffect, useRef, useState } from "react";
import { useAccount, useChainId, useEnsName } from "wagmi";
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightStartOnRectangleIcon,
  LinkIcon,
} from "@heroicons/react/20/solid";
import { chains } from "../utils/chains";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Spinner } from "./Spinner";
import { useCustomDisconnect } from "../hooks/useCustomDisconnect";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { useNavigateToPage } from "../hooks/useCustomization";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { WAAP_CONNECTOR_ID, WAAP_WALLET_URL } from "../utils/waap";

export const CustomAccountWidget = () => {
  const isLg = useBreakpoint("lg");
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useCustomDisconnect();
  const { disconnect: disconnectDatastore } = useDatastoreConnectionContext();
  // Shared with Home's Connect wallet (LoginFlowProvider), so both show the same loading state.
  const { signIn, isBusy } = useLoginFlow();
  const navigateToPage = useNavigateToPage();

  const { data: ensName } = useEnsName({
    address: address,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isWaap = connector?.id === WAAP_CONNECTOR_ID;

  // Close the dropdown on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Failed to copy address", e);
    }
  };

  const handleLinkedWallets = () => {
    setMenuOpen(false);
    navigateToPage("linked-wallets");
  };

  const handleOpenWallet = () => {
    setMenuOpen(false);
    window.open(WAAP_WALLET_URL, "_blank", "noopener,noreferrer");
  };

  const handleDisconnect = async () => {
    setMenuOpen(false);
    // Disconnect through the datastore context so the saved Passport session token is cleared too
    if (address) await disconnectDatastore(address);
    else await disconnect();
  };

  // Handle loading states
  if (isBusy) {
    return (
      <button
        disabled
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm border-1 border-gray-200 opacity-75"
      >
        <Spinner className="text-gray-500" />
        <span className="text-sm font-medium text-gray-500">Connecting...</span>
      </button>
    );
  }

  // Handle disconnected state — connect through WaaP (Human Wallet)
  if (!isConnected || !address) {
    return (
      <button
        onClick={() => signIn({ useWaap: true })}
        className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-1 border-gray-200"
      >
        <span className="text-sm font-medium text-gray-700">Connect Wallet</span>
      </button>
    );
  }

  const itemClass =
    "flex items-center gap-3 h-10 px-2.5 rounded-lg w-full text-left text-[14px] text-[#0a0a0a] hover:bg-[#f4f6f5] transition-colors";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 pl-0 py-0 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-1 border-gray-200"
      >
        {/* Wallet Icon */}
        <div className="bg-[#e6f2f0] px-3 py-2 flex items-center justify-center rounded-none lg:rounded-lg">
          {connector?.icon ? (
            <img src={connector.icon} alt={connector.name || "Wallet"} className="w-5 h-5" />
          ) : (
            <div className="w-5 h-5 bg-gray-300 rounded" />
          )}
        </div>

        {isLg && (
          <>
            {/* Chain Icon */}
            <div className="bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
              <img
                src={getChainIcon(chainId)}
                alt="Chain"
                className="w-3.5 h-3.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "./assets/eth-network-logo.svg";
                }}
              />
            </div>

            {/* Address or ENS name */}
            <span className="text-sm font-semibold text-gray-900">{ensName || formatAddress(address)}</span>

            {/* Dropdown Arrow */}
            <ChevronDownIcon
              className={`w-4 h-4 pr-2 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {menuOpen && (
        // Account menu — design-system WalletMenu, restyled to the Passport theme (teal accent,
        // #737373 muted). Items informed by aztec / human-covenant: Copy Address, Open Wallet
        // (WaaP only), Disconnect.
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[280px] bg-white rounded-xl overflow-hidden z-50 border-1 border-gray-200 shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
        >
          {/* Header: wallet icon + identity */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-full bg-[#e6f2f0]">
              {connector?.icon ? (
                <img src={connector.icon} alt={connector.name || "Wallet"} className="w-6 h-6" />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-semibold text-[#0a0a0a] truncate leading-tight">
                {ensName || formatAddress(address)}
              </span>
              <span className="text-[12px] text-[#737373] leading-tight">{connector?.name || "Wallet"}</span>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Items */}
          <div className="flex flex-col gap-0.5 p-2">
            <button role="menuitem" onClick={handleCopy} className={itemClass}>
              <DocumentDuplicateIcon className="w-5 h-5 flex-shrink-0 text-[#737373]" />
              <span>{copied ? "Copied!" : "Copy address"}</span>
            </button>

            {isWaap && (
              <button role="menuitem" onClick={handleLinkedWallets} className={itemClass}>
                <LinkIcon className="w-5 h-5 flex-shrink-0 text-[#737373]" />
                <span>Linked wallets</span>
              </button>
            )}

            {isWaap && (
              <button role="menuitem" onClick={handleOpenWallet} className={itemClass}>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 flex-shrink-0 text-[#737373]" />
                <span>Open Wallet</span>
              </button>
            )}

            <button
              role="menuitem"
              onClick={handleDisconnect}
              className="flex items-center gap-3 h-10 px-2.5 rounded-lg w-full text-left text-[14px] text-[#c2401c] hover:bg-[#fbf1ec] transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
