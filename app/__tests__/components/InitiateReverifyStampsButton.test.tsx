import { vi, describe, it, expect } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";
import {
  ReverifyStampsModal,
  InitiateReverifyStampsButton,
  ExpiredStampModalProps,
} from "../../components/InitiateReverifyStampsButton";
import { CeramicContextState, CeramicContext } from "../../context/ceramicContext";
import { StampClaimingContext, StampClaimProgressStatus } from "../../context/stampClaimingContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { defaultPlatformMap } from "../../config/platformMap";

const defaultProps: ExpiredStampModalProps = {
  isOpen: true,
  onClose: vi.fn(),
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
  allPlatforms: defaultPlatformMap,
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
  claimCredentials: vi.fn(),
  status: StampClaimProgressStatus.Idle,
};

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
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });
});

describe("ReverifyStampsModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders the user's expired stamps", () => {
    act(() => {
      render(
        <CeramicContext.Provider value={mockCeramicContext}>
          <StampClaimingContext.Provider value={mockStampClaimingContext}>
            <ReverifyStampsModal {...defaultProps} />
          </StampClaimingContext.Provider>
        </CeramicContext.Provider>
      );
    });
    expect(screen.getByText("Why have my stamps expired?")).toBeInTheDocument();
    expect(screen.getByTestId("reverify-initial-button")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("should begin the flow of reverifying the user's stamps when ReverifyStamps is clicked in the modal", () => {
    act(() => {
      render(
        <CeramicContext.Provider value={mockCeramicContext}>
          <StampClaimingContext.Provider value={mockStampClaimingContext}>
            <ReverifyStampsModal {...defaultProps} />
          </StampClaimingContext.Provider>
        </CeramicContext.Provider>
      );
    });
    const button = screen.getByTestId("reverify-initial-button");
    fireEvent.click(button);
    expect(screen.getByText("Why have my stamps expired?")).toBeInTheDocument();
    expect(screen.getByText("Discord" || "Snapshot")).toBeInTheDocument();
    expect(screen.queryByText("Cancel")).toBeEnabled();
  });
});
