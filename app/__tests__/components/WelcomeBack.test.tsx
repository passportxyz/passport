import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { WelcomeBack, WelcomeBackProps } from "../../components/WelcomeBack";
import { useNavigate } from "react-router-dom";

const defaultProps: WelcomeBackProps = {
  onOpen: jest.fn(),
  handleFetchPossibleEVMStamps: jest.fn(),
  resetStampsAndProgressState: jest.fn(),
};

jest.mock("../../utils/onboard");

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

describe("WelcomeBack", () => {
  it("renders the component", () => {
    render(<WelcomeBack {...defaultProps} />);

    expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
    expect(screen.getByText("One-Click Verification")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You can now verify most web3 stamps and return to your destination faster with one-click verification!"
      )
    ).toBeInTheDocument();
  });
});
