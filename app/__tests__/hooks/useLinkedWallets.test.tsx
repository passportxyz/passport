import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ACCOUNT = "0xAaaa000000000000000000000000000000000001";
const ACTIVE = "0xbbbb000000000000000000000000000000000002";
const PARKED = "0xcccc000000000000000000000000000000000003";
const UNLINK_AT = "2026-12-04T12:00:00.000Z";

// The WaaP SDK provider, reached through the WaaP connector.
const provider = {
  getLinkedWallets: vi.fn(),
  linkAddress: vi.fn(),
  unlinkAddress: vi.fn(),
  cancelUnlink: vi.fn(),
};

vi.mock("wagmi", () => ({
  useConnections: () => [
    { connector: { id: "waap", uid: "waap-uid", getProvider: async () => provider }, accounts: [ACCOUNT] },
  ],
}));
vi.mock("../../utils/waap", () => ({ isWaaPConnector: (c?: { id: string }) => c?.id === "waap" }));

import { useLinkedWallets } from "../../hooks/useLinkedWallets";

const render = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useLinkedWallets(), { wrapper });
};

describe("useLinkedWallets", () => {
  beforeEach(() => {
    Object.values(provider).forEach((fn) => fn.mockReset());
    provider.getLinkedWallets.mockResolvedValue([
      { address: ACTIVE, unlinkAt: null },
      { address: PARKED, unlinkAt: UNLINK_AT },
    ]);
  });

  // Active wallets count (and the limit applies to them); parked ones can still be restored.
  it("splits WaaP's wallets into active and parked", async () => {
    const { result } = render();

    await waitFor(() => expect(result.current.addresses).toEqual([ACTIVE]));
    expect(result.current.parked).toEqual([{ address: PARKED, unlinkAt: UNLINK_AT }]);
  });

  it("restores a parked wallet with cancelUnlink and shows WaaP's updated list", async () => {
    provider.cancelUnlink.mockResolvedValue([
      { address: ACTIVE, unlinkAt: null },
      { address: PARKED, unlinkAt: null },
    ]);
    const { result } = render();
    await waitFor(() => expect(result.current.parked).toHaveLength(1));

    await act(async () => result.current.restore(PARKED));

    expect(provider.cancelUnlink).toHaveBeenCalledWith(PARKED);
    await waitFor(() => expect(result.current.addresses).toEqual([ACTIVE, PARKED]));
    expect(result.current.parked).toEqual([]);
  });

  // unlinkAddress answers with active addresses only, so the full list (with the newly parked
  // wallet and its unlinkAt) is read again.
  it("re-reads every wallet after an unlink, so the unlinked one shows as parked", async () => {
    provider.unlinkAddress.mockResolvedValue([]);
    const { result } = render();
    await waitFor(() => expect(result.current.addresses).toEqual([ACTIVE]));
    provider.getLinkedWallets.mockResolvedValue([
      { address: ACTIVE, unlinkAt: UNLINK_AT },
      { address: PARKED, unlinkAt: UNLINK_AT },
    ]);

    await act(async () => result.current.unlink(ACTIVE));

    expect(provider.unlinkAddress).toHaveBeenCalledWith(ACTIVE);
    await waitFor(() => expect(result.current.addresses).toEqual([]));
    expect(result.current.parked.map((w) => w.address)).toEqual([ACTIVE, PARKED]);
  });

  it("passes a refused restore up to the screen", async () => {
    provider.cancelUnlink.mockRejectedValue({ error: "This account already has the maximum of 5 linked wallets" });
    const { result } = render();
    await waitFor(() => expect(result.current.parked).toHaveLength(1));

    await expect(result.current.restore(PARKED)).rejects.toEqual({
      error: "This account already has the maximum of 5 linked wallets",
    });
  });
});
