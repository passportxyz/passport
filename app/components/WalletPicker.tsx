import React, { useState } from "react";
import { useConnect, useConnectors, type Connector } from "wagmi";
import { WalletIcon } from "@heroicons/react/20/solid";
import { ModalCard, NavListItem } from "@human.tech/ui/core";
import { closeWalletPicker, useWalletPickerOpen } from "../hooks/useWalletPicker";
import { isWaaPConnector } from "../utils/waap";

const isUserRejection = (error: unknown) => {
  const { code, message } = (error ?? {}) as { code?: number; message?: string };
  return code === 4001 || /rejected|denied/i.test(message ?? "");
};

// WaaP (Human Wallet) has its own "Continue with Human Wallet" button. The generic `injected`
// connector is only a fallback for when no browser wallet announced itself via EIP-6963.
const pickerConnectors = (connectors: readonly Connector[]) => {
  const announced = connectors.some((c) => c.type === "injected" && c.id !== "injected");
  return connectors.filter((c) => !isWaaPConnector(c) && !(announced && c.id === "injected"));
};

const connectorIcon = (connector: Connector) => {
  if (connector.icon) return <img src={connector.icon} alt="" width={20} height={20} />;
  return <WalletIcon width={18} height={18} />;
};

const connectorSubtitle = (connector: Connector) => {
  if (connector.type === "injected")
    return connector.id === "injected" ? "Use an installed wallet" : "Browser extension";
  return undefined;
};

// "Connect your wallet" picker for external wallets, opened with openWalletPicker().
export const WalletPicker = () => {
  const isOpen = useWalletPickerOpen();
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState<string>();

  const close = (connected: boolean) => {
    setError(undefined);
    closeWalletPicker(connected);
  };

  const pick = async (connector: Connector) => {
    setError(undefined);
    setPendingId(connector.uid);
    try {
      await connectAsync({ connector });
      close(true);
    } catch (e) {
      console.error("Error connecting wallet", e);
      if (!isUserRejection(e)) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPendingId(undefined);
    }
  };

  return (
    <ModalCard isOpen={isOpen} onClose={() => close(false)} title="Connect a wallet" showClose brand="passport">
      <div className="flex flex-col gap-2" data-testid="wallet-picker">
        {pickerConnectors(connectors).map((connector) => (
          <NavListItem
            key={connector.uid}
            icon={connectorIcon(connector)}
            tint="sky"
            title={connector.id === "injected" ? "Browser wallet" : connector.name}
            subtitle={connectorSubtitle(connector)}
            trailing={pendingId === connector.uid ? "Connecting…" : undefined}
            disabled={!!pendingId}
            onClick={pendingId ? undefined : () => pick(connector)}
            compact
          />
        ))}
        {error && (
          <p role="alert" className="text-sm text-color-9">
            {error}
          </p>
        )}
      </div>
    </ModalCard>
  );
};
