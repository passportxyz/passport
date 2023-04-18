import React from "react";
import { screen, waitFor, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Welcome from "../../pages/Welcome";
import { UserContextState } from "../../context/userContext";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { RefreshMyStampsModal } from "../../components/RefreshMyStampsModal";
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

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

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

jest.mock("../../components/RefreshMyStampsModal.tsx", () => ({
  RefreshMyStampsModal: () => <div data-testid="refresh-my-stamps-modal" />,
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
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
    expect(screen.getByText("One-Click Verification")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You can now verify most web3 stamps and return to your destination faster with one-click verification!"
      )
    ).toBeInTheDocument();
  });
});

describe("when the user is navigated to the Welcome page", () => {
  it("should render the Skip for Now button", () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByTestId("skip-for-now-button"));
  });

  it("should render the Refresh My Stamps button", () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Welcome />
      </Router>
    );

    expect(screen.getByTestId("refresh-my-stamps-button"));
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
//     //   mockUserContext,
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
      mockUserContext,
      mockCeramicContext,
      <Router>
        <Welcome />
      </Router>
    );

    const buttonRefreshMyStampsModal = screen.queryByTestId("refresh-my-stamps-button");

    fireEvent.click(buttonRefreshMyStampsModal!);

    const refreshMyStampsModal = screen.getByTestId("refresh-my-stamps-modal");

    expect(refreshMyStampsModal).toBeInTheDocument();
    expect(screen.getByTestId("refresh-my-stamps-modal")).toBeInTheDocument();
  });
});
