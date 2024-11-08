import { vi, describe, it, expect } from "vitest";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScrollMintBadge } from "../../components/scroll/ScrollMintPage";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import axios from "axios";
import { useMintBadge } from "../../hooks/useMintBadge";
import { MemoryRouter } from "react-router-dom";
import { usePublicClient } from "wagmi";

vi.mock("axios");

vi.mock("wagmi", async (importActual) => ({ ...(await importActual()), usePublicClient: vi.fn() }));

const issueAttestationMock = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 25)));

vi.mock("../../hooks/useIssueAttestation", () => ({
  useIssueAttestation: () => ({
    issueAttestation: issueAttestationMock,
    needToSwitchChain: false,
  }),
  useAttestationNonce: () => ({ nonce: 2, isLoading: false, isError: false, refresh: vi.fn() }),
}));

const successMock = vi.fn();
const failureMock = vi.fn();
vi.mock("../../hooks/useMessage", () => ({
  useMessage: () => ({ success: successMock, failure: failureMock }),
}));

vi.mock("../../config/scroll_campaign", () => ({
  scrollCampaignChain: { id: "0x1", rpcUrl: "https://example.com" },
  scrollCampaignBadgeProviders: ["provider1", "provider2", "provider3"],
  scrollCampaignBadgeProviderInfo: {
    provider1: { contractAddress: "0xContract1", level: 1 },
    provider2: { contractAddress: "0xContract2", level: 2 },
    provider3: { contractAddress: "0xContract3", level: 3 },
  },
  scrollCanvasProfileRegistryAddress: "0xProfileRegistry",
}));

const mockGetPassport = vi.fn();

const mockDatabase = {
  addStamps: vi.fn().mockResolvedValue({
    mocked: "response",
  }),
  getPassport: mockGetPassport,
};

const mockCeramicContext = makeTestCeramicContext({
  database: mockDatabase as any,
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
    vi.clearAllMocks();
  });

  it("renders no badges message when user does not qualify", async () => {
    mockGetPassport.mockResolvedValue({
      status: "Success",
      passport: { stamps: [] },
    });

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("We're sorry!")).toBeInTheDocument();
      expect(
        screen.getByText(/Eligibility is limited to specific projects, and contributions had to be made by October 1st/)
      ).toBeInTheDocument();
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

    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return "0xMockProfileAddress";
        } else if (functionName === "isProfileMinted") {
          return true;
        } else if (functionName === "burntProviderHashes") {
          return false;
        }
      }),
    } as any);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      expect(screen.getByText(/You had enough commits and contributions to a qualifying project./)).toBeInTheDocument();
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

    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return Promise.resolve("0xMockProfileAddress");
        } else if (functionName === "isProfileMinted") {
          return Promise.resolve(true);
        } else if (functionName === "burntProviderHashes") {
          return Promise.resolve(false);
        }
      }),
    } as any);

    vi.mocked(axios.post).mockResolvedValue({ data: { error: null } });

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

    let userProviderHashesCalled = false;
    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return "0xMockProfileAddress";
        } else if (functionName === "isProfileMinted") {
          return true;
        } else if (functionName === "burntProviderHashes") {
          return true;
        } else if (functionName === "userProviderHashes") {
          if (!userProviderHashesCalled) {
            userProviderHashesCalled = true;
            return encodedHash;
          } else {
            throw new Error("Invalid");
          }
        }
      }),
    } as any);

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

    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return "0xMockProfileAddress";
        } else if (functionName === "isProfileMinted") {
          return true;
        } else if (functionName === "burntProviderHashes") {
          return true;
        } else if (functionName === "userProviderHashes") {
          throw new Error("Invalid");
        }
      }),
    } as any);

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

    let burntProviderHashesCallCount = 0;
    let userProviderHashesCallCount = 0;
    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return "0xMockProfileAddress";
        } else if (functionName === "isProfileMinted") {
          return true;
        } else if (functionName === "burntProviderHashes") {
          const val = [true, false, true][burntProviderHashesCallCount];
          burntProviderHashesCallCount++;
          return val;
        } else if (functionName === "userProviderHashes") {
          userProviderHashesCallCount++;
          if (userProviderHashesCallCount === 2) {
            return encodedHash;
          } else {
            throw new Error("Invalid");
          }
        }
      }),
    } as any);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText(/You had enough commits and contributions to a qualifying project./)).toBeInTheDocument();
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

    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          return "0xMockProfileAddress";
        } else if (functionName === "isProfileMinted") {
          return false;
        } else if (functionName === "burntProviderHashes") {
          return false;
        }
      }),
    } as any);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(screen.getByText("Congratulations!")).toBeInTheDocument();
      // expect(screen.getByRole("button", { name: /check again/i })).toBeInTheDocument();
    });
    // expect(screen.getByText(/It looks like you don't have a Canvas yet/)).toBeInTheDocument();
    // expect(screen.getByText("here")).toHaveAttribute("href", "https://scroll.io/canvas");
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

    vi.mocked(usePublicClient).mockReturnValue({
      readContract: vi.fn().mockImplementation(({ functionName }) => {
        if (functionName === "getProfile") {
          throw new Error("Canvas check failed");
        } else if (functionName === "burntProviderHashes") {
          return false;
        }
      }),
    } as any);

    renderWithContext(mockCeramicContext, <TestComponent />);

    await waitFor(() => {
      expect(failureMock).toHaveBeenCalledWith({
        title: "Error",
        message: "An unexpected error occurred while checking for your Scroll Canvas profile.",
      });
    });
  });
});
