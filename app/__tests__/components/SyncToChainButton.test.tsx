import { screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { getButtonMsg, SyncToChainButton } from "../../components/SyncToChainButton";
import { OnChainStatus } from "../../utils/onChainStatus";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Chain } from "../../utils/chains";
import { ChakraProvider } from "@chakra-ui/react";
import { switchNetworkMock } from "../../__mocks__/web3modalMock";

const mockWalletState = {
  address: "0x123",
  provider: jest.fn(),
  chain: "0x14a33",
};

jest.mock("../../context/walletStore", () => ({
  useWalletStore: (callback: (state: any) => any) => callback(mockWalletState),
}));

jest.mock("axios");
// Create a jest mock function for verifyAndAttest
const mockVerifyAndAttest = jest.fn().mockImplementation(() => {
  return {
    wait: () => Promise.resolve(undefined),
  };
});

// Mock the getSigner method of ethers.BrowserProvider
const mockGetSigner = jest.fn().mockImplementation(() => {
  return {
    getAddress: jest.fn().mockResolvedValue("mocked_address"),
  };
});

// Mock the ethers.BrowserProvider class
jest.mock("ethers", () => {
  return {
    ethers: {
      BrowserProvider: jest.fn().mockImplementation(() => {
        return { getSigner: mockGetSigner };
      }),
      Contract: jest.fn().mockImplementation(() => {
        return {
          recipientNonces: () => 1,
          verifyAndAttest: mockVerifyAndAttest,
        };
      }),
    },
    isError: jest.fn(),
  };
});

describe("getButtonMsg function", () => {
  it("returns correct messages for each OnChainStatus", () => {
    expect(getButtonMsg(OnChainStatus.NOT_MOVED)).toEqual("Mint");
    expect(getButtonMsg(OnChainStatus.MOVED_OUT_OF_DATE)).toEqual("Update");
    expect(getButtonMsg(OnChainStatus.MOVED_UP_TO_DATE)).toEqual("Minted");
  });
});

const chainConfig = {
  id: "test",
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
  id: "0x14a33",
  attestationProviderConfig: {
    status: "enabled",
    name: "Ethereum Attestation Service",
    easScanUrl: "test.com",
  },
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SyncToChainButton component", () => {
  it("should show coming soon if in active", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithoutEas} />
    );

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });
  it("should be disabled if not active", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithoutEas} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should be disabled if up to date", async () => {
    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.MOVED_UP_TO_DATE} chain={chainWithEas} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should initiate chain change if on different chain", async () => {
    const anotherChainWithEas = new Chain({
      ...chainConfig,
      id: "0x123",
      attestationProviderConfig: {
        status: "enabled",
        name: "Ethereum Attestation Service",
        easScanUrl: "test.com",
      },
    });

    renderWithContext(
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={anotherChainWithEas} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveTextContent("Mint");
    fireEvent.click(btn);
    await waitFor(() => expect(switchNetworkMock).toHaveBeenCalled());
  });
  it("should render error toast if no stamps", async () => {
    renderWithContext(
      { ...mockCeramicContext },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} />
      </ChakraProvider>
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);
    await screen.findByText("You do not have any Stamps to bring onchain.");
  });

  it("should render success toast if stamps are brought on chain", async () => {
    jest
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { invalidCredentials: [], passport: [], signature: { v: 8, r: "s", s: "a" } } });
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} />
      </ChakraProvider>,
      {},
      { threshold: 10, rawScore: 20 }
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);

    await screen.findByText("Passport submitted to chain.");
  });

  it("should prompt user if score is low", async () => {
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <ChakraProvider>
        <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} chain={chainWithEas} />
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
