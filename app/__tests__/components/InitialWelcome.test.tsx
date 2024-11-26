import { vi, describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InitialWelcome } from "../../components/InitialWelcome";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(() => ({})),
}));

const defaultProps = {
  onBoardFinished: vi.fn(),
  dashboardCustomizationKey: null,
  hasPassports: false,
};

const defaultPropsReturningUser = {
  onBoardFinished: vi.fn(),
  dashboardCustomizationKey: null,
  hasPassports: true,
};

describe("InitialWelcome", () => {
  it("renders the component and displays the first step", () => {
    render(<InitialWelcome {...defaultProps} />);

    expect(screen.getByText("Build Your Passport Score")).toBeInTheDocument();
  });

  it("navigates through the steps and calls onBoardFinished when completed", () => {
    render(<InitialWelcome {...defaultProps} />);

    const nextButton = screen.getByText("Next");

    // Click "Next" to go to step 2
    fireEvent.click(nextButton);
    expect(screen.getByText("Accumulate Verified Stamps")).toBeInTheDocument();

    // Click "Next" to go to step 3
    fireEvent.click(nextButton);
    expect(screen.getByText("Get verified with one simple step")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();

    const verifyButton = screen.getByText("Verify");
    // Click "Verify" to finish the steps
    fireEvent.click(verifyButton);
    expect(defaultProps.onBoardFinished).toHaveBeenCalledTimes(1);
  });

  it("skips the onboarding steps and navigates to the dashboard", () => {
    const navigateMock = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(navigateMock);

    render(<InitialWelcome {...defaultProps} />);

    const skipButton = screen.getByText("Skip");
    fireEvent.click(skipButton);

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("navigates through the first steps & back & the skip the onboarding steps & navigates to the dashboard", () => {
    const navigateMock = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(navigateMock);

    render(<InitialWelcome {...defaultProps} />);

    const nextButton = screen.getByText("Next");

    // Click "Next" to go to step 2
    fireEvent.click(nextButton);
    expect(screen.getByText("Accumulate Verified Stamps")).toBeInTheDocument();

    const backButton = screen.getByText("Back");

    // Click "Back" to go to step 1
    fireEvent.click(backButton);
    expect(screen.getByText("Build Your Passport Score")).toBeInTheDocument();

    const skipButton = screen.getByText("Skip");
    // Skips the steps
    fireEvent.click(skipButton);

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });
});

describe("InitialWelcomeReturningUser", () => {
  it("renders the component and displays the first step", () => {
    render(<InitialWelcome {...defaultPropsReturningUser} />);

    expect(screen.getByText("Auto refresh")).toBeInTheDocument();
  });
});
