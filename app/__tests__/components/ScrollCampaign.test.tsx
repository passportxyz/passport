import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { AppRoutes } from "../../pages";
import { ScrollStepsBar } from "../../components/ScrollCampaign";
import { useParams } from "react-router-dom";
import { CredentialResponseBody } from "@gitcoin/passport-types";
import { googleStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";
import * as passportIdentity from "@gitcoin/passport-identity";
import { useScrollBadge } from "../../hooks/useScrollBadge";

const navigateMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock,
  useParams: jest.fn().mockImplementation(jest.requireActual("react-router-dom").useParams),
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

jest.mock("../../utils/helpers", () => {
  return {
    ...jest.requireActual("../../utils/helpers"),
    generateUID: jest.fn(() => "test"),
  };
});

jest.mock("../../config/scroll_campaign", () => {
  const originalModule = jest.requireActual("../../config/scroll_campaign");
  return {
    ...originalModule,
    scrollCampaignBadgeProviders: ["SomeDeveloperProvider"],
    loadBadgeProviders: jest.fn().mockImplementation(() => {
      return ["SomeDeveloperProvider"];
    }),
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
  beforeEach(() => {
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

  it("navigates to the success page in case the verification succeeded", async () => {
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

    // const canvasRedirectButton = screen.queryByTestId("canvasRedirectButton");
    // expect(canvasRedirectButton).toBeInTheDocument();

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});
