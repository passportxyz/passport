import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, render } from "@testing-library/react";
import Dashboard from "../../pages/Dashboard";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import { mock } from "jest-mock-extended";
import { JsonRpcSigner } from "@ethersproject/providers";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState, IsLoadingPassportState } from "../../context/ceramicContext";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { ChakraProvider } from "@chakra-ui/react";
import { DashboardCTAs } from "../../pages/Dashboard";
import { Customization } from "../../utils/customizationUtils";

jest.mock("react-confetti");

jest.mock("../../components/CardList", () => ({ CardList: () => <div>Card List</div> }));

jest.mock("../../components/SyncToChainButton", () => <div>Sync to Chain</div>);

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

jest.mock("../../components/Header", () => () => null);

jest.mock("@self.id/web", () => {
  return {
    EthereumAuthProvider: jest.fn(),
  };
});

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

jest.mock("../../components/DashboardScorePanel", () => ({
  DashboardScorePanel: ({ className }: { className: string }) => (
    <div data-testid="dashboard-score-panel" className={className}>
      DashboardScorePanel
    </div>
  ),
  DashboardScoreExplanationPanel: () => (
    <div data-testid="dashboard-score-explanation-panel">DashboardScoreExplanationPanel</div>
  ),
}));

jest.mock("../../components/CustomDashboardPanel.tsx", () => ({
  DynamicCustomDashboardPanel: ({ className }: { className: string }) => (
    <div data-testid="dynamic-custom-dashboard-panel" className={className}>
      DynamicCustomDashboardPanel
    </div>
  ),
}));

const mockToggleConnection = jest.fn();
const mockHandleDisconnection = jest.fn();
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

beforeEach(() => {
  jest.clearAllMocks();
  (framework.useViewerConnection as jest.Mock).mockImplementation(() => [
    {
      status: "connected",
    },
    jest.fn(),
    jest.fn(),
  ]);
});

describe("dashboard notifications", () => {
  // using https://www.npmjs.com/package/jest-localstorage-mock to mock localStorage
  beforeEach(async () => {
    await closeAllToasts();
    localStorage.removeItem("successfulRefresh");
  });
  it("should show success toast when stamps are verified", async () => {
    localStorage.setItem("successfulRefresh", "true");
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Router>
            <Dashboard />
          </Router>
        </ChakraProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText("Your stamps are verified!")).toBeInTheDocument();
  });
  it("should show error toast when stamps aren't verified", async () => {
    localStorage.setItem("successfulRefresh", "false");
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <Router>
            <Dashboard />
          </Router>
        </ChakraProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText("Stamps weren't verified. Please try again.")).toBeInTheDocument();
  });
  it("should show a loading stamps alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }]);
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.Loading,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    // We are waiting for a notification "One moment while we load your Stamps..."
    const databaseLoadingAlert = screen.getByTestId("db-stamps-alert");
    expect(databaseLoadingAlert).toBeInTheDocument();
  });

  it("should show an initializing passport alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }]);
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.CreatingPassport,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    const ceramicLoadingAlert = screen.getByTestId("initializing-alert");
    expect(ceramicLoadingAlert).toBeInTheDocument();
  });
});

describe("DashboardCTAs", () => {
  it("renders with default customization", () => {
    render(<DashboardCTAs customization={{ key: "none" } as Customization} />);

    expect(screen.getByTestId("dashboard-score-panel")).toHaveClass("w-full xl:w-1/2");
    expect(screen.getByTestId("dashboard-score-explanation-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("dynamic-custom-dashboard-panel")).not.toBeInTheDocument();
  });

  it("renders with custom dashboard panel", () => {
    render(
      <DashboardCTAs
        customization={{ key: "custom", useCustomDashboardPanel: true, showExplanationPanel: true } as Customization}
      />
    );

    expect(screen.getByTestId("dashboard-score-panel")).toHaveClass("w-full");
    expect(screen.getByTestId("dashboard-score-explanation-panel")).toBeInTheDocument();
    expect(screen.getByTestId("dynamic-custom-dashboard-panel")).toHaveClass(
      "order-1 lg:order-2 max-w-full xl:max-w-md"
    );
  });

  it("renders without explanation panel", () => {
    render(
      <DashboardCTAs
        customization={{ key: "custom", useCustomDashboardPanel: true, showExplanationPanel: false } as Customization}
      />
    );

    expect(screen.getByTestId("dashboard-score-panel")).toHaveClass("w-full");
    expect(screen.queryByTestId("dashboard-score-explanation-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("dynamic-custom-dashboard-panel")).toHaveClass("order-1 lg:order-2 max-w-full xl:w-2/3");
  });

  it("applies correct CSS classes", () => {
    render(<DashboardCTAs customization={{ key: "none" } as Customization} />);

    // eslint-disable-next-line testing-library/no-node-access
    const container = screen.getByTestId("dashboard-score-panel").parentElement?.parentElement;
    expect(container).toHaveClass("col-span-full flex flex-col xl:flex-row gap-8");

    // eslint-disable-next-line testing-library/no-node-access
    const innerContainer = screen.getByTestId("dashboard-score-panel").parentElement;
    expect(innerContainer).toHaveClass("col-span-full order-2 flex flex-col grow lg:flex-row gap-8 mt-0.5");
  });
});

describe.skip("when app fails to load ceramic stream", () => {
  it("should display a modal for user to retry connection, or close", () => {
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.FailedToConnect,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    const retryModal = screen.getByTestId("retry-modal-content");
    expect(retryModal).toBeInTheDocument();

    const retryButton = screen.getByTestId("retry-modal-try-again");
    expect(retryButton).toBeInTheDocument();

    const closeButton = screen.getByTestId("retry-modal-close");
    expect(closeButton).toBeInTheDocument();
  });

  it("when retry button is clicked, it should retry ceramic connection", () => {
    const mockCeramicConnect = jest.fn();
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }, mockCeramicConnect]);

    renderWithContext(
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.FailedToConnect,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    fireEvent.click(screen.getByTestId("retry-modal-try-again"));

    expect(mockCeramicConnect).toBeCalledTimes(1);
  });

  it("when done button is clicked, it should disconnect the user", () => {
    renderWithContext(
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.FailedToConnect,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    fireEvent.click(screen.getByTestId("retry-modal-close"));

    expect(mockToggleConnection).toBeCalledTimes(1);
  });
});

it("reset passport button should open refresh modal when clicked", async () => {
  renderWithContext(
    {
      ...mockCeramicContext,
      expiredProviders: ["Ens"],
    },
    <Router>
      <Dashboard />
    </Router>
  );

  fireEvent.click(screen.getByText("Reverify stamps"));
  await waitFor(() => {
    expect(screen.getByText("Refresh Expired Stamps")).toBeInTheDocument();
  });
});

describe("when the user has a passport", () => {
  it("shows Passport JSON button", () => {
    renderWithContext(
      mockCeramicContext,
      <Router>
        <Dashboard />
      </Router>
    );

    expect(screen.getByTestId("button-passport-json")).toBeInTheDocument();
  });
});

describe("when the user clicks Passport JSON", () => {
  it("it should display a modal", async () => {
    renderWithContext(
      mockCeramicContext,
      <Router>
        <Dashboard />
      </Router>
    );

    const buttonPassportJson = screen.queryByTestId("button-passport-json");

    fireEvent.click(buttonPassportJson!);

    const verifyModal = await screen.findByRole("dialog");
    const buttonDone = screen.getByTestId("button-passport-json-done");

    expect(verifyModal).toBeInTheDocument();
    expect(buttonDone).toBeInTheDocument();
  });
});
