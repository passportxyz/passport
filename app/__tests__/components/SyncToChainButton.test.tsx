import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { getButtonMsg, SyncToChainButton } from "../../components/SyncToChainButton";
import { OnChainStatus } from "../../components/NetworkCard";
import { UserContextState } from "../../context/userContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");
const mockSetChain = jest.fn();
const mockConnectedChain = {
  chains: [],
  connectedChain: { id: "0x14a33", namespace: "mock_namespace", name: "mock_name" },
  settingChain: false,
};
jest.mock("@web3-onboard/react", () => ({
  useSetChain: () => [mockConnectedChain, mockSetChain],
}));

jest.mock("axios");
// Create a jest mock function for recipientNonces and verifyAndAttest
const mockRecipientNonces = jest.fn();
const mockVerifyAndAttest = jest.fn();

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
    expect(getButtonMsg(OnChainStatus.NOT_MOVED)).toEqual("Go");
    expect(getButtonMsg(OnChainStatus.MOVED_OUT_OF_DATE)).toEqual("Update");
    expect(getButtonMsg(OnChainStatus.MOVED_UP_TO_DATE)).toEqual("Up to date");
  });
});

const chain = {
  id: "test",
  token: "test",
  label: "test",
  rpcUrl: "test",
  icon: "icon",
};

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SyncToChainButton component", () => {
  it("should show coming soon if in active", async () => {
    render(<SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} isActive={false} chain={chain} />);

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });
  it("should be disabled if not active", async () => {
    render(<SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} isActive={false} chain={chain} />);
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should be disabled if up to date", async () => {
    render(<SyncToChainButton onChainStatus={OnChainStatus.MOVED_UP_TO_DATE} isActive={true} chain={chain} />);
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveAttribute("disabled");
  });
  it("should initiate chain change if on different chain", async () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} isActive={true} chain={chain} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    expect(btn).toHaveTextContent("Go");
    fireEvent.click(btn);
    await waitFor(() => expect(mockSetChain).toHaveBeenCalled());
  });
  it("should render error toast if no stamps", async () => {
    renderWithContext(
      mockUserContext,
      { ...mockCeramicContext },
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} isActive={true} chain={{ ...chain, id: "0x14a33" }} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);
    await screen.findByText("You do not have any stamps to bring on-chain.");
  });

  it("should render success toast if stamps are brought on chain", async () => {
    jest
      .spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { invalidCredentials: [], passport: [], signature: { v: 8, r: "s", s: "a" } } });
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passport: { ...mockCeramicContext.passport, stamps: [{ id: "test" } as any] },
      },
      <SyncToChainButton onChainStatus={OnChainStatus.NOT_MOVED} isActive={true} chain={{ ...chain, id: "0x14a33" }} />
    );
    const btn = screen.getByTestId("sync-to-chain-button");
    fireEvent.click(btn);

    await screen.findByText("Passport submitted to chain.");
  });
});
