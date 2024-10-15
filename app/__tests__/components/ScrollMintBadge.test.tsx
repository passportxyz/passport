import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ethers } from "ethers";
import { ScrollMintBadge } from "../../components/scroll/ScrollMintPage";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { PassportDatabase } from "@gitcoin/passport-database-client";
import axios from "axios";
import { useMintBadge } from "../../hooks/useMintBadge";
import { MemoryRouter } from "react-router-dom";

jest.mock("axios");

jest.mock("ethers");

const issueAttestationMock = jest.fn();

jest.mock("../../hooks/useAttestation", () => ({
  useAttestation: () => ({
    getNonce: jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(0), 1000))),
    issueAttestation: issueAttestationMock,
    needToSwitchChain: false,
  }),
}));

const successMock = jest.fn();
const failureMock = jest.fn();
jest.mock("../../hooks/useMessage", () => ({
  useMessage: () => ({ success: successMock, failure: failureMock }),
}));

jest.mock("../../config/scroll_campaign", () => ({
  scrollCampaignChain: { id: "0x1", rpcUrl: "https://example.com" },
  scrollCampaignBadgeProviders: ["provider1", "provider2", "provider3"],
  scrollCampaignBadgeProviderInfo: {
    provider1: { contractAddress: "0xContract1", level: 1 },
    provider2: { contractAddress: "0xContract2", level: 2 },
    provider3: { contractAddress: "0xContract3", level: 3 },
  },
  scrollCanvasProfileRegistryAddress: "0xProfileRegistry",
}));

const mockGetPassport = jest.fn();

const mockCeramicContext = makeTestCeramicContext({
  database: Object.assign({}, new PassportDatabase("test", "test", "test"), {
    getPassport: mockGetPassport,
  }),
});

const InnerTestComponent = () => {
  const { onMint, syncingToChain } = useMintBadge();
  return <ScrollMintBadge onMint={onMint} syncingToChain={syncingToChain} />;
};

const TestComponent = () => {
  return (
    <MemoryRouter>
      <InnerTestComponent />
    </MemoryRouter>
  );
};

describe("ScrollMintBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders no badges message when user does not qualify", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: { stamps: [] },
    });

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("We're sorry!")).toBeInTheDocument();
      expect(screen.getByText("You don't qualify for any badges.")).toBeInTheDocument();
    });
  });

  it("renders congratulations message when user qualifies for badges", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
        ],
      },
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      expect(
        screen.getAllByText(
          (_, element) =>
            element?.textContent === "You qualify for 1 badge. Mint your badge and get a chance to work with us."
        )
      ).not.toHaveLength(0);
      expect(screen.getByRole("button", { name: /mint badge/i })).toBeInTheDocument();
    });
  });

  it("handles minting process", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
        ],
      },
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    (axios.post as jest.Mock).mockResolvedValue({ data: { error: null } });

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mint badge/i })).toBeInTheDocument();
    });

    const mintButton = screen.getByRole("button", { name: /mint badge/i });
    await userEvent.click(mintButton);

    await waitFor(() => {
      expect(screen.getByText("Minting badge...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(issueAttestationMock).toHaveBeenCalled();
    });
  });

  it("handles hash already used by current user", async () => {
    const hash = "bla:MTIzNDU2Nzg5MA==";
    const encodedHash = "0x" + Buffer.from(hash.split(":")[1], "base64").toString("hex");
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash },
            },
          },
        ],
      },
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest.fn().mockResolvedValue(true),
      userProviderHashes: jest.fn().mockResolvedValueOnce(encodedHash).mockRejectedValue(new Error("Invalid")),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mint badge/i })).toBeInTheDocument();
    });

    const mintButton = screen.getByRole("button", { name: /mint badge/i });
    await userEvent.click(mintButton);

    await waitFor(() => {
      expect(screen.getByText("Minting badge...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(issueAttestationMock).toHaveBeenCalled();
    });
  });

  it("handles hash already used by another user", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
        ],
      },
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest.fn().mockResolvedValue(true),
      userProviderHashes: jest.fn().mockRejectedValue(new Error("Invalid")),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(
        screen.getByText("Your badge credentials have already been claimed with another address.")
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /mint badge/i })).not.toBeInTheDocument();
    });
  });

  it("handles errors during passport loading", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Error",
    });

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(failureMock).toHaveBeenCalledWith({
        title: "Error",
        message: "An unexpected error occurred while loading your Passport.",
      });
    });
  });

  it("handles some hash already used by another user", async () => {
    const hash = "bla:MTIzNDU2Nzg5MA==";
    const encodedHash = "0x" + Buffer.from(hash.split(":")[1], "base64").toString("hex");

    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
          {
            provider: "provider2",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA=+" },
            },
          },
          {
            provider: "provider3",
            credential: {
              credentialSubject: { hash },
            },
          },
        ],
      },
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
      userProviderHashes: jest
        .fn()
        .mockRejectedValueOnce(new Error("Invalid"))
        .mockResolvedValueOnce(encodedHash)
        .mockRejectedValueOnce(new Error("Invalid")),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          (_, element) =>
            element?.textContent ===
            "You qualify for 2 badges. Mint your badges and get a chance to work with us. (Some badge credentials could not be validated because they have already been claimed on another address.)"
        )
      ).not.toHaveLength(0);
      expect(screen.queryByRole("button", { name: /mint badge/i })).toBeInTheDocument();
    });
  });

  it("handles errors during passport loading", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Error",
    });

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(failureMock).toHaveBeenCalledWith({
        title: "Error",
        message: "An unexpected error occurred while loading your Passport.",
      });
    });
  });

  it("renders 'Check Again' button when hasCanvas is false", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
        ],
      },
    });

    const mockContract = {
      burntProviderHashes: jest.fn().mockResolvedValue(false),
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
    (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => ({}));

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /check again/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/It looks like you don't have a Canvas yet/)).toBeInTheDocument();
    expect(screen.getByText("here")).toHaveAttribute("href", "https://scroll.io/canvas");
  });

  it("handles errors during Canvas check", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "provider1",
            credential: {
              credentialSubject: { hash: "base64:MTIzNDU2Nzg5MA==" },
            },
          },
        ],
      },
    });

    const mockContract = {
      burntProviderHashes: jest.fn().mockResolvedValue(false),
      getProfile: jest.fn().mockRejectedValue(new Error("Canvas check failed")),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);
    (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => ({}));

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(failureMock).toHaveBeenCalledWith({
        title: "Error",
        message: "An unexpected error occurred while checking for your Scroll Canvas profile.",
      });
    });
  });
});
