import { vi, describe, it, expect } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { getButtonMsg, SyncToChainButton } from "../../components/SyncToChainButton";
import { OnChainStatus } from "../../utils/onChainStatus";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Chain } from "../../utils/chains";
import { ChakraProvider } from "@chakra-ui/react";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { optimism } from "@reown/appkit/networks";

vi.mock("axios");

vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal()),
  useSwitchChain: () => ({
    switchChain: vi.fn(),
  }),
  useAccount: () => ({
    chain: optimism,
    address: "0x123",
  }),
  useReadContract: () => ({
    data: BigInt(1),
    isLoading: false,
    isError: false,
    queryKey: "test",
  }),
  useWriteContract: () => ({
    writeContractAsync: vi.fn(),
  }),
}));

describe("getButtonMsg function", () => {
  it("returns correct messages for each OnChainStatus", () => {
    expect(getButtonMsg(OnChainStatus.NOT_MOVED)).toEqual("Mint");
    expect(getButtonMsg(OnChainStatus.MOVED_OUT_OF_DATE)).toEqual("Update");
    expect(getButtonMsg(OnChainStatus.MOVED_UP_TO_DATE)).toEqual("Minted");
  });
});

const chainConfig = {
  id: "0xa" as const,
  token: "test",
  label: "test",
  rpcUrl: "test",
  icon: "icon",
  chainLink: "",
  explorerUrl: "",
};

const chainWithoutEas = new Chain(chainConfig);

const chainWithEas = new Chain({
  ...chainConfig,
  id: "0xa",
  attestationProviderConfig: {
    skipByDefault: false,
    monochromeIcon: "/images/ethereum-icon.svg",
    status: "enabled",
    name: "Ethereum Attestation Service",
    easScanUrl: "test.com",
  },
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SyncToChainButton component", () => {
  beforeEach(() => {
    closeAllToasts();
  });

  it("should show coming soon if in active", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithoutEas} isLoading={false} />
    );

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });
  it("should be disabled if not active", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithoutEas} isLoading={false} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should be disabled if up to date", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.MOVED_UP_TO_DATE} chain={chainWithEas} isLoading={false} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should initiate chain change if on different chain", async () => {
    const anotherChainWithEas = new Chain({
      ...chainConfig,
      id: "0x14a33",
      attestationProviderConfig: {
        skipByDefault: false,
        monochromeIcon: "/images/ethereum-icon.svg",
        status: "enabled",
        name: "Ethereum Attestation Service",
        easScanUrl: "test.com",
      },
    });

    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { invalidCredentials: [], passport: [], signature: { v: 8, r: "s", s: "a" } },
    });

    renderWithContext(
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={anotherChainWithEas} isLoading={false} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveTextContent("Mint");
    fireEvent.click(btn);
    // await waitFor(() => expect(switchNetworkMock).toHaveBeenCalled());
  });
  it("should render error toast if no stamps", async () => {
    renderWithContext(
      { ...mockCeramicContext },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} isLoading={false} />
      </ChakraProvider>
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);
    await screen.findByText("You do not have any Stamps to bring onchain.", { exact: false });
  });

  it("should render success toast if stamps are brought on chain", async () => {
    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { invalidCredentials: [], passport: [], signature: { v: 8, r: "s", s: "a" } },
    });
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} isLoading={false} />
      </ChakraProvider>,
      {},
      { threshold: 10, rawScore: 20 }
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);

    await waitFor(() => screen.findByText("Attestation submitted to chain."));
  });

  it("should prompt user if score is low", async () => {
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} isLoading={false} />
      </ChakraProvider>,
      {},
      { threshold: 15, rawScore: 10 }
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);

    await screen.findByText(
      `While some benefits might be available with a lower score, many partners require a score of 15 or higher.`,
      { exact: false }
    );
  });
});
