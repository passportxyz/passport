import { screen, waitFor } from "@testing-library/react";
import { ExpiredStampModal, getProviderIdsFromPlatformId } from "../../components/ExpiredStampModal";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { UserContextState } from "../../context/userContext";

jest.mock("../../utils/onboard.ts");

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("ExpiredStampModal", () => {
  it("should render a list of platforms", () => {
    renderWithContext(
      {} as UserContextState,
      { ...mockCeramicContext, expiredProviders: ["Linkedin", "Ens", "Lens"] },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    const exptedProviders = ["Linkedin", "ENS", "Lens"];
    exptedProviders.forEach((platform: string) => {
      expect(screen.getByText(platform)).toBeInTheDocument();
    });
  });
  it("should not render duplicate platforms", () => {
    renderWithContext(
      {} as UserContextState,
      {
        ...mockCeramicContext,
        expiredProviders: ["EthGTEOneTxnProvider"],
      },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getAllByText("ETH").length).toBe(1);
  });
  it("should get a list of all PROVIDER_ID for a given platform", () => {
    expect(getProviderIdsFromPlatformId("Gitcoin")).toEqual([
      "GitcoinContributorStatistics#numGrantsContributeToGte#1",
      "GitcoinContributorStatistics#numGrantsContributeToGte#10",
      "GitcoinContributorStatistics#numGrantsContributeToGte#25",
      "GitcoinContributorStatistics#numGrantsContributeToGte#100",
      "GitcoinContributorStatistics#totalContributionAmountGte#10",
      "GitcoinContributorStatistics#totalContributionAmountGte#100",
      "GitcoinContributorStatistics#totalContributionAmountGte#1000",
      "GitcoinContributorStatistics#numGr14ContributionsGte#1",
      "GitcoinContributorStatistics#numRoundsContributedToGte#1",
      "GitcoinGranteeStatistics#numOwnedGrants#1",
      "GitcoinGranteeStatistics#numGrantContributors#10",
      "GitcoinGranteeStatistics#numGrantContributors#25",
      "GitcoinGranteeStatistics#numGrantContributors#100",
      "GitcoinGranteeStatistics#totalContributionAmount#100",
      "GitcoinGranteeStatistics#totalContributionAmount#1000",
      "GitcoinGranteeStatistics#totalContributionAmount#10000",
      "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1",
    ]);
  });
  it("should delete all stamps within each expired platform", async () => {
    const handleDeleteStamps = jest.fn();
    renderWithContext(
      {} as UserContextState,
      { ...mockCeramicContext, expiredProviders: ["Ens", "Linkedin", "Facebook"], handleDeleteStamps },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    const deleteButton = screen.getByTestId("delete-duplicate");

    expect(deleteButton.getAttribute("disabled")).toBeNull();

    deleteButton.click();
    expect(deleteButton.getAttribute("disabled")).not.toBeNull();

    expect(handleDeleteStamps).toHaveBeenCalledWith(["Facebook", "FacebookProfilePicture", "Linkedin", "Ens"]);
    await waitFor(() => expect(deleteButton.getAttribute("disabled")).toBeNull());
  });
});
