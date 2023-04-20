import { screen, waitFor } from "@testing-library/react";
import { ExpiredStampModal, getProviderIdsFromPlatformId } from "../../components/ExpiredStampModal";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState, IsLoadingPassportState } from "../../context/ceramicContext";
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
      { ...mockCeramicContext, expiredProviders: ["Linkedin", "Ens", "POAP", "Lens"] },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    const exptedProviders = ["Linkedin", "ENS", "POAP", "Lens"];
    exptedProviders.forEach((platform: string) => {
      expect(screen.getByText(platform)).toBeInTheDocument();
    });
  });
  it("should not render duplicate platforms", () => {
    renderWithContext(
      {} as UserContextState,
      {
        ...mockCeramicContext,
        expiredProviders: [
          "Github",
          "FiveOrMoreGithubRepos",
          "ForkedGithubRepoProvider",
          "TenOrMoreGithubFollowers",
          "FirstEthTxnProvider",
          "EthGTEOneTxnProvider",
        ],
      },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    expect(screen.getAllByText("Github").length).toBe(1);
    expect(screen.getAllByText("ETH").length).toBe(1);
  });
  it("should get a list of all PROVIDER_ID for a given platform", () => {
    expect(getProviderIdsFromPlatformId("Github")).toEqual([
      "Github",
      "FiveOrMoreGithubRepos",
      "ForkedGithubRepoProvider",
      "StarredGithubRepoProvider",
      "TenOrMoreGithubFollowers",
      "FiftyOrMoreGithubFollowers",
    ]);
  });
  it("should delete all stamps within each expired platform", async () => {
    const handleDeleteStamps = jest.fn();
    renderWithContext(
      {} as UserContextState,
      { ...mockCeramicContext, expiredProviders: ["Github", "Ens", "Linkedin", "Facebook"], handleDeleteStamps },
      <ExpiredStampModal isOpen={true} onClose={() => {}} />
    );

    screen.getByTestId("delete-duplicate").click();

    const spinner = screen.getByTestId("removing-stamps-spinner");
    expect(spinner).toBeInTheDocument();
    expect(handleDeleteStamps).toHaveBeenCalledWith([
      "Ens",
      "Facebook",
      "FacebookFriends",
      "FacebookProfilePicture",
      "Github",
      "FiveOrMoreGithubRepos",
      "ForkedGithubRepoProvider",
      "StarredGithubRepoProvider",
      "TenOrMoreGithubFollowers",
      "FiftyOrMoreGithubFollowers",
      "Linkedin",
    ]);

    await waitFor(() => expect(spinner).not.toBeInTheDocument());
  });
});
