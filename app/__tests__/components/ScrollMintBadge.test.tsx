import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ethers } from "ethers";
import { ScrollMintBadge } from "../../components/ScrollCampaign";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { PassportDatabase } from "@gitcoin/passport-database-client";
import axios from "axios";

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
  scrollCampaignBadgeProviders: ["provider1", "provider2"],
  scrollCampaignBadgeProviderInfo: {
    provider1: { contractAddress: "0xContract1", level: 1 },
    provider2: { contractAddress: "0xContract2", level: 2 },
  },
}));

const mockGetPassport = jest.fn();

const mockCeramicContext = makeTestCeramicContext({
  database: Object.assign({}, new PassportDatabase("test", "test", "test"), {
    getPassport: mockGetPassport,
  }),
});

describe("ScrollMintBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders no badges message when user does not qualify", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: { stamps: [] },
    });

    renderWithContext(mockCeramicContext, <ScrollMintBadge />);

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
      burntProviderHashes: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(mockCeramicContext, <ScrollMintBadge />);

    await waitFor(() => {
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      expect(
        screen.getByText("You qualify for 1 badge. Mint your badge and get a chance to work with us.")
      ).toBeInTheDocument();
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
      burntProviderHashes: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    (axios.post as jest.Mock).mockResolvedValue({ data: { error: null } });

    renderWithContext(mockCeramicContext, <ScrollMintBadge />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /mint badge/i })).toBeInTheDocument();
    });

    const mintButton = screen.getByRole("button", { name: /mint badge/i });
    await userEvent.click(mintButton);

    await waitFor(() => {
      expect(screen.getByText("Minting...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(issueAttestationMock).toHaveBeenCalled();
    });
  });

  it("handles errors during passport loading", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Error",
    });

    renderWithContext(mockCeramicContext, <ScrollMintBadge />);

    await waitFor(() => {
      expect(failureMock).toHaveBeenCalledWith({
        title: "Error",
        message: "An unexpected error occurred while loading your Passport.",
      });
    });
  });
});
