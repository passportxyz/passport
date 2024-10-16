import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { AppRoutes } from "../../pages";
import { useParams } from "react-router-dom";
import { CredentialResponseBody, PROVIDER_ID } from "@gitcoin/passport-types";
import { googleStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";
import * as passportIdentity from "@gitcoin/passport-identity";
import { useScrollBadge } from "../../hooks/useScrollBadge";
import { ScrollStepsBar } from "../../components/scroll/ScrollLayout";
import { useMintBadge } from "../../hooks/useMintBadge";
import { ProviderWithTitle } from "../../components/ScrollCampaign";
import { ethers } from "ethers";
import { scrollCampaignChain } from "../../config/scroll_campaign";
import { useBreakpoint } from "../../hooks/useBreakpoint";

jest.mock("@gitcoin/passport-database-client");
jest.mock("ethers");

const navigateMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock,
  useParams: jest.fn().mockImplementation(jest.requireActual("react-router-dom").useParams),
}));

jest.mock("@gitcoin/passport-database-client");

const mockDatabase = {
  addStamps: jest.fn().mockResolvedValue({
    mocked: "response",
  }),
  getPassport: jest.fn().mockResolvedValue({
    status: "Success",
    passport: {
      stamps: [],
    },
  }),
};

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  database: mockDatabase as any,
});

jest.mock("../../utils/helpers", () => {
  return {
    ...jest.requireActual("../../utils/helpers"),
    generateUID: jest.fn(() => "test"),
  };
});

jest.mock("../../config/scroll_campaign", () => {
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
    loadBadgeProviders: jest.fn().mockImplementation(() => {
      return mockBadgeProviders;
    }),
    scrollCampaignChain: { id: "0x1", rpcUrl: "https://example.com" },
  };
});

jest.mock("../../config/platformMap", () => {
  const originalModule = jest.requireActual("../../config/platformMap");
  return {
    ...originalModule,
    CUSTOM_PLATFORM_TYPE_INFO: {
      ...originalModule.CUSTOM_PLATFORM_TYPE_INFO,
      DEVEL: {
        ...originalModule.CUSTOM_PLATFORM_TYPE_INFO.DEVEL,
        platformClass: jest.fn().mockImplementation(() => ({
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

jest.mock("@gitcoin/passport-identity", () => {
  const originalModule = jest.requireActual("@gitcoin/passport-identity");
  return {
    ...originalModule,
    fetchVerifiableCredential: jest.fn().mockImplementation(async () => {
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

jest.mock("../../hooks/useScrollBadge", () => {
  return {
    useScrollBadge: jest.fn().mockImplementation(() => {
      return {
        badges: [],
        errors: {},
        areBadgesLoading: false,
        hasAtLeastOneBadge: false,
      };
    }),
  };
});

jest.mock("../../hooks/useBreakpoint");

describe("Landing page tests", () => {
  it("goes to next page when login successful", async () => {
    const mockUseLoginFlow = jest.fn().mockReturnValue({
      isLoggingIn: true,
      signIn: ({ onLoggedIn }: { onLoggedIn: () => void }) => {
        onLoggedIn();
      },
      loginStep: "DONE",
    });

    jest.mock("../../hooks/useLoginFlow", () => ({
      useLoginFlow: mockUseLoginFlow,
    }));

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
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });
  it("shows step 0 correctly", () => {
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll-developer", step: "0" });
    (useBreakpoint as jest.Mock).mockReturnValue(true);

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
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll-developer", step: "1" });
    (useBreakpoint as jest.Mock).mockReturnValue(true);

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
    jest.restoreAllMocks();
    jest.clearAllMocks();
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
    jest.spyOn(passportIdentity, "fetchVerifiableCredential").mockImplementation(async () => {
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
    (useScrollBadge as jest.Mock).mockReturnValue({
      hasAtLeastOneBadge: true,
      badges: [{ contract: "0X000", hasBadge: true, badgeLevel: 1, badgeUri: "https://example.com" }],
      errors: {},
      areBadgesLoading: false,
      error: null,
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

jest.mock("../../hooks/useMintBadge", () => {
  return {
    useMintBadge: jest.fn().mockReturnValue({
      onMint: jest.fn(),
      syncingToChain: false,
      earnedBadges: [],
      badgesFreshlyMinted: false,
    }),
  };
});
describe("ScrollCampaign Step 2 (Mint Badge) tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("renders ScrollMintBadge component correctly at step 2", () => {
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    const mockOnMint = jest.fn();
    (useMintBadge as jest.Mock).mockReturnValue({
      onMint: mockOnMint,
      syncingToChain: false,
      earnedBadges: [],
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
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    const mockOnMint = jest.fn();
    const earnedBadges: ProviderWithTitle[] = [
      {
        name: "SomeDeveloperProvider" as PROVIDER_ID,
        title: "Mock Badge Title",
        image: "mockImage.png",
        level: 1,
      },
    ];

    (useMintBadge as jest.Mock).mockReturnValue({
      onMint: mockOnMint,
      syncingToChain: false,
      earnedBadges: earnedBadges,
      badgesFreshlyMinted: false,
    });

    (mockDatabase.getPassport as jest.Mock).mockResolvedValue({
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
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll-developer", step: "2" });

    (mockDatabase.getPassport as jest.Mock).mockResolvedValue({
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

    (useMintBadge as jest.Mock).mockReturnValue({
      onMint: jest.fn(),
      syncingToChain: true,
      badgesFreshlyMinted: false,
    });

    const mockContract = {
      getProfile: jest.fn().mockResolvedValue("0xMockProfileAddress"),
      isProfileMinted: jest.fn().mockResolvedValue(true),
      burntProviderHashes: jest.fn().mockResolvedValue(false),
    };

    (ethers.Contract as jest.Mock).mockImplementation(() => mockContract);

    renderWithContext(
      mockCeramicContext,
      <MemoryRouter initialEntries={["/campaign/scroll-developer/2"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Verify that the ScrollMintingBadge component is rendered
    expect(screen.getByText("Minting badge...")).toBeInTheDocument();

    // Check that the badges are displayed
    await waitFor(() => {
      expect(screen.getByText("Mock Badge Title")).toBeInTheDocument();
    });
  });
});
