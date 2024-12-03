import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResetWalletConnection } from "../../hooks/useResetWalletConnection";
import * as wagmi from "wagmi";

vi.mock("wagmi", () => ({
  useDisconnect: vi.fn(),
}));

describe("useResetWalletConnection", () => {
  const mockDisconnect = vi.fn();
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock = {};

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // Mock useDisconnect
    vi.mocked(wagmi.useDisconnect).mockReturnValue({
      disconnect: mockDisconnect,
    } as any);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("should not disconnect if no wallet reset index is set", () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX = "";

    renderHook(() => useResetWalletConnection());

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("should disconnect if wallet reset index is different from stored value", () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX = "2";
    vi.mocked(localStorage.getItem).mockReturnValue("1");

    renderHook(() => useResetWalletConnection());

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith("walletResetIndex", "2");
  });

  it("should not disconnect if wallet reset index matches stored value", () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX = "1";
    vi.mocked(localStorage.getItem).mockReturnValue("1");

    renderHook(() => useResetWalletConnection());

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("should handle disconnect errors gracefully", () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX = "2";
    vi.mocked(localStorage.getItem).mockReturnValue("1");
    mockDisconnect.mockImplementation(() => {
      throw new Error("Disconnect failed");
    });

    // Should not throw error
    expect(() => {
      renderHook(() => useResetWalletConnection());
    }).not.toThrow();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith("walletResetIndex", "2");
  });

  it("should handle first time connection with no stored index", () => {
    process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX = "1";
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    renderHook(() => useResetWalletConnection());

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenCalledWith("walletResetIndex", "1");
  });
});
