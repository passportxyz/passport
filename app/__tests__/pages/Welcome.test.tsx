import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Welcome from "../../pages/Welcome";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Stamp } from "@gitcoin/passport-types";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const ceramicWithPassport = {
  ...mockCeramicContext,
  passport: { stamps: [{} as Stamp] },
} as unknown as CeramicContextState;

jest.mock("../../components/RefreshMyStampsModal.tsx", () => ({
  RefreshMyStampsModal: () => <div data-testid="refresh-my-stamps-modal" />,
}));

jest.mock("../../components/InitialWelcome.tsx", () => ({
  InitialWelcome: () => <div data-testid="initial-welcome" />,
}));

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

describe("Welcome", () => {
  it("renders the page", () => {
    renderWithContext(
      ceramicWithPassport,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByText("Welcome back to Passport")).toBeInTheDocument();
    expect(screen.getByText("Privacy-First Verification")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Passport helps you collect "stamps" that prove your humanity and reputation. You decide what stamps are shown. And your privacy is protected at each step of the way.'
      )
    ).toBeInTheDocument();
  });
});

describe("when the user is navigated to the Welcome page", () => {
  it("should render the Skip for Now button", () => {
    renderWithContext(
      ceramicWithPassport,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByTestId("skip-for-now-button"));
  });

  it("should render the Refresh My Stamps button", () => {
    renderWithContext(
      ceramicWithPassport,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByTestId("next-button"));
  });
});

// describe("when the user clicks the Skip for Now button", () => {
//   it("should navigate to the Dashboard", async () => {
//     const mockCeramicConnect = jest.fn();
//     (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }, mockCeramicConnect]);

//     jest.mock("react-router-dom", () => ({
//       useNavigate: () => jest.fn(),
//     }));
//     // renderWithContext(
//     //   mockCeramicContext,
//     //   <Router>
//     //     <Welcome />
//     //   </Router>
//     // );

//     render(<Welcome />);

//     const buttonSkipForNow = screen.getByTestId("skip-for-now-button");

//     fireEvent.click(buttonSkipForNow!);

//     await waitFor(() => expect(window.));
//   });
// });

describe("when the user clicks the Refresh My Stamps button it launches the Refresh My Stamps modal", () => {
  it("should render the refresh stamps modal", () => {
    renderWithContext(
      ceramicWithPassport,
      <Router>
        <Welcome />
      </Router>
    );

    const buttonRefreshMyStampsModal = screen.queryByTestId("next-button");

    fireEvent.click(buttonRefreshMyStampsModal!);

    const refreshMyStampsModal = screen.getByTestId("refresh-my-stamps-modal");

    expect(refreshMyStampsModal).toBeInTheDocument();
    expect(screen.getByTestId("refresh-my-stamps-modal")).toBeInTheDocument();
  });
});

describe("when a new use visits the Welcome page", () => {
  it("should render the Skip for Now button", () => {
    renderWithContext(
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByTestId("initial-welcome")).toBeInTheDocument();
  });
});
