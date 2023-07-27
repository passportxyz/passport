import React from "react";
import { fireEvent, screen, waitFor, render } from "@testing-library/react";
import Dashboard from "../../pages/Dashboard";
import { UserContextState } from "../../context/userContext";
import { mockAddress } from "../../__test-fixtures__/onboardHookValues";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import { mock } from "jest-mock-extended";
import { JsonRpcSigner } from "@ethersproject/providers";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState, IsLoadingPassportState } from "../../context/ceramicContext";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";

jest.mock("../../utils/onboard.ts", () => ({
  chains: [],
}));

jest.mock("../../components/RefreshStampModal", () => ({
  RefreshStampModal: () => <div>Refresh Modal</div>,
}));

jest.mock("../../components/SyncToChainButton", () => <div>Sync to Chain</div>);

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

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

const mockToggleConnection = jest.fn();
const mockHandleDisconnection = jest.fn();
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockUserContext: UserContextState = makeTestUserContext({
  toggleConnection: mockToggleConnection,
  handleDisconnection: mockHandleDisconnection,
  address: mockAddress,
  signer: mockSigner,
});
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

describe("when user has no passport", () => {
  it("should display a loading spinner", async () => {
    renderWithContext(
      mockUserContext,
      { ...mockCeramicContext, passport: false },
      <Router>
        <Dashboard />
      </Router>
    );

    // screen loads mobile view - check for md loading-spinner
    expect(screen.getByTestId("loading-spinner-passport-md"));
  });
});

describe("when the user has a passport", () => {
  it("it should not display a loading spinner", async () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Dashboard />
      </Router>
    );

    expect(screen.queryByTestId("loading-spinner-passport-md")).not.toBeInTheDocument();
  });

  it("shows Passport JSON button", () => {
    renderWithContext(
      mockUserContext,
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
      mockUserContext,
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

describe("when viewer connection status is connecting", () => {
  it("should show a 'waiting for signature' alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connecting" }]);
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Dashboard />
      </Router>
    );

    const waitingForSignature = screen.getByTestId("selfId-connection-alert");
    expect(waitingForSignature).toBeInTheDocument();
  });
});

describe.only("dashboard notifications", () => {
  // using https://www.npmjs.com/package/jest-localstorage-mock to mock localStorage
  beforeEach(async () => {
    await closeAllToasts();
    localStorage.removeItem("successfulRefresh");
  });
  it("should show success toast when stamps are verified", async () => {
    localStorage.setItem("successfulRefresh", "true");
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    expect(screen.getByText("Your stamps are verified!")).toBeInTheDocument();
  });
  it("should show error toast when stamps aren't verified", async () => {
    localStorage.setItem("successfulRefresh", "false");
    render(
      <Router>
        <Dashboard />
      </Router>
    );
    expect(screen.getByText("Stamps weren't verifed. Please try again.")).toBeInTheDocument();
  });
  it("should show a loading stamps alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }]);
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.Loading,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    const databaseLoadingAlert = screen.getByTestId("db-stamps-alert");
    expect(databaseLoadingAlert).toBeInTheDocument();
  });

  it("should show a connecting to ceramic alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }]);
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: IsLoadingPassportState.LoadingFromCeramic,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    const ceramicLoadingAlert = screen.getByTestId("ceramic-stamps-alert");
    expect(ceramicLoadingAlert).toBeInTheDocument();
  });
});

describe("when app fails to load ceramic stream", () => {
  it("should display a modal for user to retry connection, or close", () => {
    renderWithContext(
      mockUserContext,
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
      mockUserContext,
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
      mockUserContext,
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

describe("when a user clicks on the Passport logo", () => {
  it("should disconnect the user's wallet and navigate to homepage", async () => {
    const mockCeramicConnect = jest.fn();
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }, mockCeramicConnect]);

    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Dashboard />
      </Router>
    );

    const passportLogoLink = screen.getByTestId("passport-logo-link");

    fireEvent.click(passportLogoLink);

    expect(mockHandleDisconnection).toBeCalledTimes(1);

    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });
  it("if ceramic errors are present it should show reset banner", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passportHasCacaoError: true,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    expect(
      screen.getByText(
        "We have detected some broken stamps in your passport. Your passport is currently locked because of this. We need to fix these errors before you continue using Passport. This might take up to 5 minutes."
      )
    ).toBeInTheDocument();
  });
  it("reset passport button should open refresh modal when clicked", async () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passportHasCacaoError: true,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    fireEvent.click(screen.getByText("Reset Passport"));
    await waitFor(() => {
      expect(screen.getByText("Refresh Modal")).toBeInTheDocument();
    });
  });
});
