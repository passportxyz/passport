/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import { GithubSibylProvider } from "../Providers/githubSibyl/githubSibyl";
import { GithubSibylRepoStatisticsProvider } from "../Providers/githubSibyl/githubSibylRepoStatistics";
import { GithubSibylUsersStatisticsProvider } from "../Providers/githubSibyl/githubSibylUsersStatistics";

const MOCK_ADDRESS = "0x09Fdb2FC36aba315B4F8ebdd89450947a64e53Ed";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Expected connected on Clique", async () => {
    // mockGetBalance.mockResolvedValueOnce("2000000000000000000");

    // const verifiedPayload = new GithubSibylRepoStatisticsProvider({
    //   threshold: 1,
    //   receivingAttribute: "sumIssuesPublicGithub",
    //   recordAttribute: "sumIssuesPublicGithub",
    // });
    // verifiedPayload.verify({address: MOCK_ADDRESS} as RequestPayload);
    // expect(verifiedPayload.valid).toEqual(true);

  });
});
