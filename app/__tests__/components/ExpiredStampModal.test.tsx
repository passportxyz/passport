import { fireEvent, screen, waitFor } from "@testing-library/react";
import { ExpiredStampModal, getProviderIdsFromPlatformId } from "../../components/ExpiredStampModal";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("ExpiredStampModal", () => {
  it("should render a list of platforms", () => {
    renderWithContext(
      { ...mockCeramicContext, expiredProviders: ["Linkedin", "Ens", "Lens"] },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    const expectedProviders = ["Linkedin", "ENS", "Lens"];
    expectedProviders.forEach((platform: string) => {
      expect(screen.getByText(platform)).toBeInTheDocument();
    });
  });

  it("should not render duplicate platforms", () => {
    renderWithContext(
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
    ]);
  });

  it("should delete all stamps within each expired platform", async () => {
    const handleDeleteStamps = jest.fn();
    renderWithContext(
      { ...mockCeramicContext, expiredProviders: ["Ens", "Linkedin", "Facebook"], handleDeleteStamps },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    const deleteButton = screen.getByTestId("delete-duplicate");

    expect(deleteButton.getAttribute("disabled")).toBeNull();

    fireEvent.click(deleteButton);
    await waitFor(() => expect(deleteButton.getAttribute("disabled")).not.toBeNull());

    expect(handleDeleteStamps).toHaveBeenCalledWith(["Facebook", "FacebookProfilePicture", "Linkedin", "Ens"]);
    await waitFor(() => expect(deleteButton.getAttribute("disabled")).toBeNull());
  });
});
