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
    expect(getProviderIdsFromPlatformId("Github")).toEqual([
      "githubAccountCreationGte#90",
      "githubAccountCreationGte#180",
      "githubAccountCreationGte#365",
      "githubContributionActivityGte#30",
      "githubContributionActivityGte#60",
      "githubContributionActivityGte#120",
    ]);
  });
  it("should delete all stamps within each expired platform", async () => {
    const handleDeleteStamps = jest.fn();
    renderWithContext(
      {} as UserContextState,
      { ...mockCeramicContext, expiredProviders: ["Github", "Ens", "Linkedin", "Facebook"], handleDeleteStamps },
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
