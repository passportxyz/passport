import { render, screen } from "@testing-library/react";
import { RefreshMyStampsModal, RefreshMyStampsModalProps } from "../../components/RefreshMyStampsModal";
import { ValidatedPlatform } from "../../signer/utils";

const defaultProps: RefreshMyStampsModalProps = {
  isOpen: true,
  onClose: jest.fn(),
  steps: [],
  validPlatforms: undefined,
  resetStampsAndProgressState: jest.fn(),
};

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
  useNavigate: () => jest.fn(),
}));

jest.mock("../../components/RefreshMyStampsModalContent.tsx", () => ({
  RefreshMyStampsModalContent: () => <div data-testid="refresh-my-stamps-modal-content" />,
}));

jest.mock("../../components/RefreshStampsProgressSteps.tsx", () => ({
  __esModule: true, // Required for default export mocking
  default: () => <div data-testid="refresh-stamps-progress-steps" />,
}));

describe("RefreshMyStampsModal", () => {
  it("renders the component with searching for stamps when fetchedPossibleEVMStamps is undefined", () => {
    render(<RefreshMyStampsModal {...defaultProps} />);

    expect(screen.getByText("Searching for Stamps")).toBeInTheDocument();
    expect(screen.getByText("Give us a moment while we check your account for existing Stamps.")).toBeInTheDocument();
    expect(screen.getByText("Please do not close the window.")).toBeInTheDocument();
  });

  it("renders the component with RefreshMyStampsModalContent when fetchedPossibleEVMStamps is not undefined", () => {
    const validPlatforms = [{ provider: "ethereum", platform_id: "1" }] as unknown as ValidatedPlatform[];
    render(<RefreshMyStampsModal {...defaultProps} validPlatforms={validPlatforms} />);

    expect(screen.getByTestId("refresh-my-stamps-modal-content")).toBeInTheDocument();
  });
});
