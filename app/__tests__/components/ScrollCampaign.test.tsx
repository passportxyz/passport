import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { AppRoutes } from "../../pages";
import { ScrollStepsBar } from "../../components/ScrollCampaign";
import { useParams } from "react-router-dom";

const navigateMock = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigateMock,
  useParams: jest.fn().mockImplementation(jest.requireActual("react-router-dom").useParams),
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

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
      <MemoryRouter initialEntries={["/campaign/scroll"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText("Developer Badge")).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalled();

    const connectWalletButton = screen.getByTestId("connectWalletButton");
    expect(connectWalletButton).toBeInTheDocument();

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/campaign/scroll/1");
    });
  });
});

describe("Component tests", () => {
  it("shows step 0 correctly", () => {
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll", step: "0" });

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
    (useParams as jest.Mock).mockReturnValue({ campaignId: "scroll", step: "1" });

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
