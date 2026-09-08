// useOnChainData.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useChains } from "wagmi";
import { createPublicClient } from "viem";
import { getAttestationData } from "../../utils/onChainStamps";
import { useCustomization } from "../../hooks/useCustomization";
import { chains, wagmiTransports } from "../../utils/chains";
import { FeatureFlags } from "../../config/feature_flags";
import { useOnChainData } from "../../hooks/useOnChainData";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// Mock dependencies
vi.mock("@datadog/browser-logs", () => ({ datadogLogs: { logger: { error: vi.fn() } } }));
vi.mock("@datadog/browser-rum", () => ({ datadogRum: { addError: vi.fn() } }));
vi.mock("wagmi", () => ({ useAccount: vi.fn(), useChains: vi.fn() }));
vi.mock("viem", () => ({ createPublicClient: vi.fn() }));
vi.mock("../../hooks/useCustomization", () => ({ useCustomization: vi.fn() }));
vi.mock("../../utils/onChainStamps", () => ({ getAttestationData: vi.fn() }));
vi.mock("../../utils/chains", () => ({ chains: [], wagmiTransports: {} }));
vi.mock("../../hooks/useOnChainStatus", () => ({ parseValidChains: () => true }));

// Sample data for tests
const mockAddress = "0x1234567890123456789012345678901234567890";
const mockDecimalChainId = 1;
const mockHexChainId = "0x1";
const mockProviders = [
  {
    providerName: "github" as PROVIDER_ID,
    expirationDate: new Date("2023-12-31"),
    issuanceDate: new Date("2023-01-01"),
  },
];

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // retryDelay: 0 makes per-query retry: 3 (set in the hook) complete instantly in tests,
        // so waitForNextUpdate() settles within the default 1000ms timeout.
        retryDelay: 0,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Object.assign(Wrapper, { queryClient });
};

describe("useOnChainData hook", () => {
  const mockQueryInvalidate = vi.fn();
  const mockConsoleError = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup feature flag
    FeatureFlags.FF_CHAIN_SYNC = true;

    // Mock chain data
    const mockChains = [
      {
        id: mockHexChainId,
        attestationProvider: { status: "enabled" },
        useCustomCommunityId: false,
      },
    ];
    Object.defineProperty(chains, "length", { value: mockChains.length });
    Object.assign(chains, mockChains);

    // Mock wagmi hooks
    vi.mocked(useChains).mockReturnValue([{ id: mockDecimalChainId, name: "Ethereum" } as any]);
    vi.mocked(useAccount).mockReturnValue({
      address: mockAddress,
      chain: { id: mockDecimalChainId },
    } as any);

    // Mock useCustomization
    vi.mocked(useCustomization).mockReturnValue({
      scorer: { id: 1 },
    } as any);

    // Mock createPublicClient
    const mockPublicClient = {};
    vi.mocked(createPublicClient).mockReturnValue(mockPublicClient as any);

    // Mock wagmiTransports
    Object.assign(wagmiTransports, {
      [mockDecimalChainId]: vi.fn(),
    });

    // Mock getAttestationData
    vi.mocked(getAttestationData).mockResolvedValue({
      score: { value: 10, expirationDate: new Date("2023-12-31") },
      providers: mockProviders,
    } as any);

    // Mock QueryClient's invalidateQueries
    vi.spyOn(QueryClient.prototype, "invalidateQueries").mockImplementation(mockQueryInvalidate);

    // Mock console.error
    console.error = mockConsoleError;
  });

  it("returns initial state while loading", async () => {
    // Arrange
    vi.mocked(getAttestationData).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              score: { value: 10, expirationDate: new Date("2023-12-31") },
              providers: mockProviders,
            } as any);
          }, 100);
        })
    );

    // Act
    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toEqual({});
    expect(result.current.activeChainProviders).toEqual([]);

    // Wait for update to complete
    await waitForNextUpdate();
  });

  it("returns data when loaded successfully", async () => {
    // Arrange
    const expectedData = {
      score: 10,
      providers: mockProviders,
      expirationDate: new Date("2023-12-31"),
    };

    // Act
    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitForNextUpdate();

    // Assert
    expect(result.current.isPending).toBe(false);
    expect(result.current.data[mockHexChainId]).toEqual(expectedData);
    expect(result.current.activeChainProviders).toEqual(mockProviders);
  });

  it("refreshes all chains when called without chainId", async () => {
    // Arrange
    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    // Wait for initial query to complete
    await waitForNextUpdate();

    // Act
    await act(async () => {
      result.current.refresh();
    });

    // Assert
    expect(mockQueryInvalidate).toHaveBeenCalledWith({
      queryKey: ["onChain", "passport", mockAddress],
    });
  });

  it("refreshes specific chain when chainId is provided", async () => {
    // Arrange
    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    // Wait for initial query to complete
    await waitForNextUpdate();

    // Act
    await act(async () => {
      result.current.refresh(mockHexChainId);
    });

    // Assert
    expect(mockQueryInvalidate).toHaveBeenCalledWith({
      queryKey: ["onChain", "passport", mockAddress, mockHexChainId],
    });
  });

  it("returns active chain providers for current chain", async () => {
    // Arrange
    const customProviders = [
      {
        providerName: "twitter" as PROVIDER_ID,
        expirationDate: new Date("2023-12-31"),
        issuanceDate: new Date("2023-01-01"),
      },
    ];

    vi.mocked(getAttestationData).mockResolvedValue({
      score: { value: 10, expirationDate: new Date("2023-12-31") },
      providers: customProviders,
    } as any);

    // Act
    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitForNextUpdate();

    // Assert
    expect(result.current.activeChainProviders).toEqual(customProviders);
  });

  it("surfaces isError when getAttestationData throws", async () => {
    vi.mocked(getAttestationData).mockRejectedValue(new Error("RPC timeout"));

    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    await waitForNextUpdate();

    expect(result.current.isError).toBe(true);
    expect(result.current.data).toEqual({});
    expect(result.current.activeChainProviders).toEqual([]);
  });

  it("surfaces isError when getPassport (inside getAttestationData) throws", async () => {
    // getPassport no longer has a silent catch — the error propagates through
    // getAttestationData which also no longer catches it.
    // We simulate this by rejecting getAttestationData (the exported boundary).
    vi.mocked(getAttestationData).mockRejectedValue(new Error("contract read failed"));

    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    await waitForNextUpdate();

    expect(result.current.isError).toBe(true);
  });

  it("does not set isError for legitimate empty on-chain data (score 0, no providers)", async () => {
    vi.mocked(getAttestationData).mockResolvedValue({
      score: { value: 0, expirationDate: new Date("2023-12-31") },
      providers: [],
    } as any);

    const { result, waitForNextUpdate } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });

    await waitForNextUpdate();

    expect(result.current.isError).toBe(false);
    expect(result.current.data[mockHexChainId]).toEqual({
      score: 0,
      providers: [],
      expirationDate: new Date("2023-12-31"),
    });
    expect(result.current.activeChainProviders).toEqual([]);
  });

  it.each(["wallet", "scorer", "disconnect"])("clears old data after a %s change", async (change) => {
    chains[0].useCustomCommunityId = true;
    const { result, rerender, waitFor } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.activeChainProviders).toEqual(mockProviders));

    // Keep the new identity pending so old data cannot be mistaken for its result.
    vi.mocked(getAttestationData).mockImplementation(() => new Promise(() => {}));
    if (change === "scorer") {
      vi.mocked(useCustomization).mockReturnValue({ scorer: { id: 2 } } as any);
    } else {
      vi.mocked(useAccount).mockReturnValue({
        address: change === "disconnect" ? undefined : "0x2234567890123456789012345678901234567890",
        chain: { id: mockDecimalChainId },
      } as any);
    }
    rerender();
    expect(result.current.data).toEqual({});
    expect(result.current.activeChainProviders).toEqual([]);
    expect(result.current.isActiveChainError).toBe(false);
  });

  it("keeps a failed inactive chain separate from the connected chain", async () => {
    chains.push({ id: "0xa", attestationProvider: { status: "enabled" } } as any);
    vi.mocked(useChains).mockReturnValue([{ id: 1 }, { id: 10 }] as any);
    const rpcError = new Error("Optimism RPC unavailable");
    vi.mocked(getAttestationData).mockImplementation(async ({ chainId }) => {
      if (chainId === "0xa") throw rpcError;
      return {
        score: { value: 10, expirationDate: new Date("2023-12-31") },
        providers: mockProviders,
      };
    });
    const { result, rerender, waitFor } = renderHook(() => useOnChainData(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.errorsByChain).toEqual({ "0xa": rpcError });
    expect(result.current.isActiveChainError).toBe(false);
    expect(result.current.activeChainProviders).toEqual(mockProviders);

    vi.mocked(useAccount).mockReturnValue({ address: mockAddress, chain: { id: 10 } } as any);
    rerender();
    expect(result.current.isActiveChainError).toBe(true);
    expect(result.current.activeChainProviders).toEqual([]);
  });

  it("retains cached data during a same-key refetch", async () => {
    const wrapper = createWrapper();
    const { result, waitFor } = renderHook(() => useOnChainData(), { wrapper });
    await waitFor(() => expect(result.current.activeChainProviders).toEqual(mockProviders));
    vi.mocked(getAttestationData).mockImplementation(() => new Promise(() => {}));
    act(() => {
      void wrapper.queryClient.refetchQueries({ queryKey: ["onChain", "passport", mockAddress] });
    });
    expect(result.current.activeChainProviders).toEqual(mockProviders);
    expect(result.current.data[mockHexChainId]?.score).toBe(10);
  });
});
