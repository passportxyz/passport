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

    expect(screen.getByText("Welcome back to Passport")).toBeInTheDocument();
    expect(screen.getByText("Privacy-First Verification")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Passport helps you collect "stamps" that prove your humanity and reputation. You decide what stamps are shown. And your privacy is protected at each step of the way.'
      )
    ).toBeInTheDocument();
  });
});
