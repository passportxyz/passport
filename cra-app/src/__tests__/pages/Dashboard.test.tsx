import React from "react";
import { fireEvent, screen } from "@testing-library/react";
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
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

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

const mockHandleConnection = jest.fn();
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockUserContext: UserContextState = makeTestUserContext({
  handleConnection: mockHandleConnection,
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

    expect(screen.getByTestId("loading-spinner-passport"));
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

    expect(screen.queryByTestId("loading-spinner-passport")).not.toBeInTheDocument();
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

describe("when app fails to load ceramic stream", () => {
  it("should display a modal for user to retry connection, or close", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        passport: undefined,
        isLoadingPassport: undefined,
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
        isLoadingPassport: undefined,
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
        isLoadingPassport: undefined,
      },
      <Router>
        <Dashboard />
      </Router>
    );

    fireEvent.click(screen.getByTestId("retry-modal-close"));

    expect(mockHandleConnection).toBeCalledTimes(1);
  });
});
