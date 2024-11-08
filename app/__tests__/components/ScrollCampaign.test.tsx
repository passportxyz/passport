import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { AppRoutes } from "../../pages";
import { CredentialResponseBody, PROVIDER_ID } from "@gitcoin/passport-types";
import { googleStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";
import * as passportIdentity from "@gitcoin/passport-identity";
import { useScrollBadge } from "../../hooks/useScrollBadge";
import { ScrollStepsBar } from "../../components/scroll/ScrollLayout";
import { useMintBadge } from "../../hooks/useMintBadge";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useIssueAttestation, useAttestationNonce } from "../../hooks/useIssueAttestation";
import { usePublicClient } from "wagmi";

vi.mock("../../hooks/useIssueAttestation");

vi.mock("@gitcoin/passport-database-client");
vi.mock("wagmi", async (importActual) => ({ ...(await importActual()), usePublicClient: vi.fn() }));

const navigateMock = vi.fn();
const useParamsMock = vi.fn();
vi.mock("react-router-dom", async (importActual) => {
  const reactRouterDom = (await importActual()) as any;
  return {
    ...reactRouterDom,
    useNavigate: () => navigateMock,
    useParams: () => useParamsMock(),
  };
});

vi.mock("@gitcoin/passport-database-client");

const mockDatabase = {
  addStamps: vi.fn().mockResolvedValue({
    mocked: "response",
  }),
  getPassport: vi.fn().mockResolvedValue({
    status: "Success",
    passport: {
      stamps: [],
    },
  }),
};

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  database: mockDatabase as any,
});

vi.mock("../../utils/helpers", async (importActual) => ({
  ...(await importActual()),
  generateUID: vi.fn(() => "test"),
}));

vi.mock("../../config/scroll_campaign", () => {
  const mockBadgeProviders = [
    {
      badgeContractAddress: "0xMockContractAddress",
      title: "Mock Badge Title",
      providers: [
        {
          name: "SomeDeveloperProvider" as PROVIDER_ID,
          image: "mockImage.png",
          level: 1,
        },
      ],
    },
  ];

  const mockScrollCampaignBadgeProviderInfo = {
    SomeDeveloperProvider: {
      contractAddress: "0xMockContractAddress",
      level: 1,
      image: "mockImage.png",
      title: "Mock Badge Title",
    },
  };

  return {
    badgeContractInfo: mockBadgeProviders,
    scrollCampaignBadgeProviderInfo: mockScrollCampaignBadgeProviderInfo,
    scrollCampaignBadgeProviders: ["SomeDeveloperProvider"],
    loadBadgeProviders: vi.fn().mockImplementation(() => {
      return mockBadgeProviders;
    }),
    scrollCampaignChain: { id: "0x1", rpcUrl: "https://example.com" },
  };
});

vi.mock("../../config/platformMap", async (importActual) => {
  const originalModule = (await importActual()) as any;
  return {
    ...originalModule,
    CUSTOM_PLATFORM_TYPE_INFO: {
      ...originalModule.CUSTOM_PLATFORM_TYPE_INFO,
      DEVEL: {
        ...originalModule.CUSTOM_PLATFORM_TYPE_INFO.DEVEL,
        platformClass: vi.fn().mockImplementation(() => ({
          getProviderPayload: async () => {
            return {
              mockedProviderPayload: "Mock",
            };
          },
        })),
      },
    },
  };
});

vi.mock("@gitcoin/passport-identity", async (importActual) => {
  const originalModule = (await importActual()) as any;
  return {
    ...originalModule,
    fetchVerifiableCredential: vi.fn().mockImplementation(async () => {
      const credentials: CredentialResponseBody[] = [
        {
          credential: googleStampFixture.credential,
          record: {
            type: "test",
            version: "test",
          },
        },
      ];
      return { credentials };
    }),
  };
});

vi.mock("../../hooks/useScrollBadge", () => {
  return {
    useScrollBadge: vi.fn().mockImplementation(() => {
      return {
        badges: [],
        errors: {},
        areBadgesLoading: false,
        hasAtLeastOneBadge: false,
      };
    }),
  };
});

vi.mock("../../hooks/useBreakpoint");

vi.mock("../../hooks/useMintBadge", () => {
  return {
    useMintBadge: vi.fn().mockReturnValue({
      onMint: vi.fn(),
      syncingToChain: false,
      earnedBadges: [],
      badgesFreshlyMinted: false,
    }),
  };
});

const mockIssueAttestation = vi.fn();

describe("Landing page tests", () => {
  beforeEach(() => {
    vi.mocked(useIssueAttestation).mockReturnValue({
      issueAttestation: mockIssueAttestation,
      needToSwitchChain: false,
    });

    vi.mocked(useAttestationNonce).mockReturnValue({
      nonce: 1,
      isLoading: false,
      isError: false,
      refresh: vi.fn(),
    });
  });

  it("goes to next page when login successful", async () => {
    vi.mock("../../hooks/useLoginFlow", () => ({
      useLoginFlow: vi.fn().mockImplementation(({ onLoggedIn }) => ({
        isLoggingIn: false,
        signIn: () => {
          onLoggedIn();
        },
        loginStep: "DONE",
      })),
    }));

    useParamsMock.mockReturnValue({ campaignId: "scroll-developer" });

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText("Developer Badge")).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalled();

    const connectWalletButton = screen.getByTestId("connectWalletButton");
    expect(connectWalletButton).toBeInTheDocument();

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/campaign/scroll-developer/1");
    });
  });
});

describe("Component tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIssueAttestation).mockReturnValue({
      issueAttestation: mockIssueAttestation,
      needToSwitchChain: false,
    });
    vi.mocked(useAttestationNonce).mockReturnValue({
      nonce: 1,
      isLoading: false,
      isError: false,
      refresh: vi.fn(),
    });
  });
  it("shows step 0 correctly", () => {
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "0" });

    vi.mocked(useBreakpoint).mockReturnValue(true);

    render(<ScrollStepsBar />);

    const connectWalletStep = screen.getByText("Connect Wallet");
    expect(connectWalletStep).toBeInTheDocument();
    expect(connectWalletStep).not.toHaveClass("brightness-50");

    const githubStep = screen.getByText("Connect to Github");
    expect(githubStep).toBeInTheDocument();
    expect(githubStep).toHaveClass("brightness-50");

    const mintStep = screen.getByText("Mint Badge");
    expect(mintStep).toBeInTheDocument();
    expect(mintStep).toHaveClass("brightness-50");
  });

  it("shows step 1 correctly", () => {
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "1" });
    vi.mocked(useBreakpoint).mockReturnValue(true);

    render(<ScrollStepsBar />);

    const connectWalletStep = screen.getByText("Connect Wallet");
    expect(connectWalletStep).toBeInTheDocument();
    expect(connectWalletStep).toHaveClass("brightness-50");

    const githubStep = screen.getByText("Connect to Github");
    expect(githubStep).toBeInTheDocument();
    expect(githubStep).not.toHaveClass("brightness-50");

    const mintStep = screen.getByText("Mint Badge");
    expect(mintStep).toBeInTheDocument();
    expect(mintStep).toHaveClass("brightness-50");
  });
});

describe("Github Connect page tests", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "1" });
    const mockOnMint = vi.fn();
    vi.mocked(useMintBadge).mockReturnValue({
      onMint: mockOnMint,
      syncingToChain: false,
      badgesFreshlyMinted: false,
    });
    vi.mocked(useScrollBadge).mockReturnValue({
      hasAtLeastOneBadge: false,
      badges: [],
      errors: {},
      areBadgesLoading: false,
    });
  });
  it("redirects to the login page when did not present", async () => {
    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/1"]}>
        <AppRoutes />
      </MemoryRouter>,
      {
        did: undefined,
        dbAccessToken: undefined,
      }
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/campaign/scroll-developer");
    });
  });

  it("displays the page correctly when logged in", async () => {
    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/1"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const connectGithubButton = screen.getByTestId("connectGithubButton");
    expect(connectGithubButton).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("saves the stamps in the DB and navigates to the success page in case the verification succeeded", async () => {
    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/1"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const connectGithubButton = screen.getByTestId("connectGithubButton");
    expect(connectGithubButton).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();

    await userEvent.click(connectGithubButton);

    expect(mockCeramicContext.database?.addStamps).toHaveBeenCalledWith([
      { provider: "randomValuesProvider", credential: googleStampFixture.credential },
    ]);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/campaign/scroll-developer/2");
    });
  });

  it("displays an error message if the verification failed", async () => {
    vi.spyOn(passportIdentity, "fetchVerifiableCredential").mockImplementation(async () => {
      return { credentials: [] };
    });

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/1"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const connectGithubButton = screen.getByTestId("connectGithubButton");
    expect(connectGithubButton).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();

    await userEvent.click(connectGithubButton);
    expect(navigateMock).not.toHaveBeenCalled();

    expect(screen.getByText(/sorry/)).toBeInTheDocument();
  });

  it("navigates to the last step when the user already has at least a badge", async () => {
    // Mocking the necessary context and hooks
    vi.mocked(useScrollBadge).mockReturnValue({
      hasAtLeastOneBadge: true,
      badges: [{ contract: "0X000", hasBadge: true, badgeLevel: 1 }],
      errors: {},
      areBadgesLoading: false,
    });

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/1"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});

describe("ScrollCampaign Step 2 (Mint Badge) tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIssueAttestation).mockReturnValue({
      issueAttestation: mockIssueAttestation,
      needToSwitchChain: false,
    });
    vi.mocked(useAttestationNonce).mockReturnValue({
      nonce: 1,
      isLoading: false,
      isError: false,
      refresh: vi.fn(),
    });
  });

  it("renders ScrollMintBadge component correctly at step 2", () => {
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    const mockOnMint = vi.fn();
    vi.mocked(useMintBadge).mockReturnValue({
      onMint: mockOnMint,
      syncingToChain: false,
      badgesFreshlyMinted: false,
    });

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/2"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText("We're sorry!")).toBeInTheDocument();
  });

  it("calls onMint when 'Mint Badge' button is clicked", async () => {
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    const mockOnMint = vi.fn();

    vi.mocked(useMintBadge).mockReturnValue({
      onMint: mockOnMint,
      syncingToChain: false,
      badgesFreshlyMinted: false,
    });

    vi.mocked(mockDatabase.getPassport).mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "SomeDeveloperProvider",
            credential: "someCredential",
            verified: true,
          },
        ],
      },
    });

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/2"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    const mintBadgeButton = screen.getByText("Mint Badge");
    expect(mintBadgeButton).toBeInTheDocument();
  });

  it("renders ScrollMintingBadge when syncingToChain is true", async () => {
    useParamsMock.mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    vi.mocked(mockDatabase.getPassport).mockResolvedValue({
      status: "Success",
      passport: {
        stamps: [
          {
            provider: "SomeDeveloperProvider",
            credential: {
              credentialSubject: {
                hash: "hash:0xMockHash",
              },
            },
          },
        ],
      },
    });

    vi.mocked(useMintBadge).mockReturnValue({
      onMint: vi.fn(),
      syncingToChain: true,
      badgesFreshlyMinted: false,
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

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/2"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Verify that the ScrollMintingBadge component is rendered
    await waitFor(() => {
      expect(screen.getByText("Minting badge...")).toBeInTheDocument();
    });

    // Check that the badges are displayed
    await waitFor(() => {
      expect(screen.getByText("Mock Badge Title")).toBeInTheDocument();
    });
  });
});
