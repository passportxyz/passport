import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ReverifyStampsModal,
  InitiateReverifyStampsButton,
  ExpiredStampModalProps,
} from "../../components/InitiateReverifyStampsButton";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState, CeramicContext, platforms } from "../../context/ceramicContext";
import { StampClaimingContext } from "../../context/stampClaimingContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../../components/GenericPlatform";

const defaultProps: ExpiredStampModalProps = {
  isOpen: true,
  onClose: jest.fn(),
};

enum IsLoadingPassportState {
  Loading,
}

const mockExpiredProviders: PROVIDER_ID[] = [
  "SnapshotProposalsProvider",
  "githubAccountCreationGte#180",
  "githubAccountCreationGte#365",
  "Discord",
];

const mockCeramicContext: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: {},
  allPlatforms: platforms,
  handleCreatePassport: async () => {},
  handleAddStamps: async () => {},
  handlePatchStamps: async () => {},
  handleDeleteStamps: async () => {},
  passportHasCacaoError: false,
  cancelCeramicConnection: () => {},
  userDid: undefined,
  expiredPlatforms: {},
  passportLoadResponse: undefined,
  verifiedProviderIds: [],
  verifiedPlatforms: {},
  expiredProviders: mockExpiredProviders,
};

const mockStampClaimingContext = {
  claimCredentials: jest.fn(),
  // Add other necessary mocks for StampClaimingContext
};

// const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const contextWrapper = ({ children }: any) => (
  <CeramicContext.Provider value={mockCeramicContext}>
    <StampClaimingContext.Provider value={mockStampClaimingContext}>{children}</StampClaimingContext.Provider>
  </CeramicContext.Provider>
);

describe("InitiateReverifyStampsButton", () => {
  it("exists in the ExpiredStampsPanel", () => {
    render(<InitiateReverifyStampsButton />);
    expect(screen.getByText("Reverify stamps")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("opens the ReverifyStampsModal", () => {
    render(<InitiateReverifyStampsButton />);
    const button = screen.getByTestId("reverify-button");
    fireEvent.click(button);
    expect(screen.getByText("Why have my stamps expired?")).toBeInTheDocument();
    expect(screen.queryByText("Next")).toBeDisabled();
  });
});

describe("ReverifyStampsModal", () => {
  it("renders the user's expired stamps", () => {
    render(
      <CeramicContext.Provider value={mockCeramicContext}>
        <StampClaimingContext.Provider value={mockStampClaimingContext}>
          <ReverifyStampsModal {...defaultProps} />
        </StampClaimingContext.Provider>
      </CeramicContext.Provider>
    );
    expect(screen.getByText("Why have my stamps expired?")).toBeInTheDocument();
  });

  it("should begin the flow of reverifying the user's stamps when ReverifyStamps is clicked in the modal", () => {
    render(
      <CeramicContext.Provider value={mockCeramicContext}>
        <StampClaimingContext.Provider value={mockStampClaimingContext}>
          <ReverifyStampsModal {...defaultProps} />
        </StampClaimingContext.Provider>
      </CeramicContext.Provider>
    );
    const button = screen.getByTestId("reverify-initial-button");
    fireEvent.click(button);
    expect(screen.getByText("Why have my stamps expired?")).toBeInTheDocument();
    expect(screen.getByText("Github")).toBeInTheDocument();
    expect(screen.getByText("Discord")).toBeInTheDocument();
    expect(screen.getByText("Snapshot")).toBeInTheDocument();
    expect(screen.queryByText("Next")).toBeDisabled();
    expect(screen.queryByText("Cancel")).toBeEnabled();
  });
});
