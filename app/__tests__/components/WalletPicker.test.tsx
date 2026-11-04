import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";

const connectAsyncMock = vi.fn();
let mockConnectors: any[] = [];

vi.mock("wagmi", () => ({
  useConnectors: () => mockConnectors,
  useConnect: () => ({ connectAsync: connectAsyncMock }),
}));
vi.mock("../../utils/waap", () => ({ isWaaPConnector: (c: any) => c?.id === "waap" }));
vi.mock("@human.tech/ui/core", () => ({
  ModalCard: ({ isOpen, onClose, children }: any) =>
    isOpen ? (
      <div>
        <button onClick={onClose}>close-picker</button>
        {children}
      </div>
    ) : null,
  NavListItem: ({ title, onClick }: any) => <button onClick={onClick}>{title}</button>,
}));

import { WalletPicker } from "../../components/WalletPicker";
import { openWalletPicker } from "../../hooks/useWalletPicker";

const connector = (id: string, name: string, type = "injected") => ({ id, name, type, uid: `uid-${id}` });

describe("WalletPicker", () => {
  beforeEach(() => {
    connectAsyncMock.mockReset();
    mockConnectors = [
      connector("waap", "Human Wallet", "WaaP"),
      connector("injected", "Injected"),
      connector("io.metamask", "MetaMask"),
      connector("coinbaseWalletSDK", "Coinbase Wallet", "coinbaseWallet"),
    ];
  });

  it("lists external wallets only: no Human Wallet, no generic row when a wallet announced itself", () => {
    render(<WalletPicker />);
    act(() => {
      void openWalletPicker();
    });
    expect(screen.getByText("MetaMask")).toBeInTheDocument();
    expect(screen.getByText("Coinbase Wallet")).toBeInTheDocument();
    expect(screen.queryByText("Human Wallet")).not.toBeInTheDocument();
    expect(screen.queryByText("Browser wallet")).not.toBeInTheDocument();
  });

  it("shows the generic browser wallet row when no wallet announced itself", () => {
    mockConnectors = [
      connector("injected", "Injected"),
      connector("coinbaseWalletSDK", "Coinbase Wallet", "coinbaseWallet"),
    ];
    render(<WalletPicker />);
    act(() => {
      void openWalletPicker();
    });
    expect(screen.getByText("Browser wallet")).toBeInTheDocument();
  });

  it("connects the picked wallet and resolves true", async () => {
    connectAsyncMock.mockResolvedValue({});
    render(<WalletPicker />);
    let result: Promise<boolean>;
    act(() => {
      result = openWalletPicker();
    });
    fireEvent.click(screen.getByText("MetaMask"));
    await expect(result!).resolves.toBe(true);
    expect(connectAsyncMock).toHaveBeenCalledWith({ connector: expect.objectContaining({ id: "io.metamask" }) });
    await waitFor(() => expect(screen.queryByText("MetaMask")).not.toBeInTheDocument());
  });

  it("resolves false when the user closes the picker", async () => {
    render(<WalletPicker />);
    let result: Promise<boolean>;
    act(() => {
      result = openWalletPicker();
    });
    fireEvent.click(screen.getByText("close-picker"));
    await expect(result!).resolves.toBe(false);
    expect(connectAsyncMock).not.toHaveBeenCalled();
  });
});
