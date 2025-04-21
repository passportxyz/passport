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
vi.mock("@datadog/browser-logs");
vi.mock("@datadog/browser-rum");
vi.mock("wagmi");
vi.mock("viem");
vi.mock("../../hooks/useCustomization");
vi.mock("../../utils/onChainStamps");

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
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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
});
