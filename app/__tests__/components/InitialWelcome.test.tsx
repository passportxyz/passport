import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { InitialWelcome } from "../../components/InitialWelcome";
import { useNavigate } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

const defaultProps = {
  onBoardFinished: jest.fn(),
  dashboardCustomizationKey: null,
};

describe("InitialWelcome", () => {
  it("renders the component and displays the first step", () => {
    render(<InitialWelcome {...defaultProps} />);

    expect(screen.getByText("Welcome to Gitcoin Passport!")).toBeInTheDocument();
    expect(screen.getByText("Privacy-First Verification")).toBeInTheDocument();
  });

  it("navigates through the steps and calls onBoardFinished when completed", () => {
    render(<InitialWelcome {...defaultProps} />);

    const nextButton = screen.getByText("Next");

    // Click "Next" to go to step 2
    fireEvent.click(nextButton);
    expect(screen.getByText("Introducing Passport Scoring")).toBeInTheDocument();
    expect(screen.getByText("Your Unique Humanity Score")).toBeInTheDocument();

    // Click "Next" to go to step 3
    fireEvent.click(nextButton);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("Verification Steps")).toBeInTheDocument();

    // Click "Next" to finish the steps
    fireEvent.click(nextButton);
    expect(defaultProps.onBoardFinished).toHaveBeenCalledTimes(1);
  });

  it("skips the last step, resets the step, and navigates to the dashboard", () => {
    const navigateMock = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigateMock);

    render(<InitialWelcome {...defaultProps} />);

    const nextButton = screen.getByText("Next");

    // Click "Next" to go to step 2
    fireEvent.click(nextButton);
    // Click "Next" to go to step 3
    fireEvent.click(nextButton);

    const skipButton = screen.getByText("Skip for now");

    // Click "Skip For Now" to reset the step and navigate to the dashboard
    fireEvent.click(skipButton);
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });
});
