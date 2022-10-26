// ----- Libs
import { GitcoinContributorStatisticsProvider } from "../gitcoinGrantsContributorStatistics";

describe("GitcoinContributorStatisticsProvider class", function () {
  it("should be properly initialized", function () {
    const threshold = 193;
    const receivingAttribute = "aaa";
    const recordAttribute = "bbb";
    const gitcoin = new GitcoinContributorStatisticsProvider({
      threshold,
      receivingAttribute,
      recordAttribute,
    });

    expect(gitcoin.type).toEqual(`GitcoinContributorStatistics#${recordAttribute}#${threshold}`);
    expect(gitcoin.dataUrl).toEqual("https://gitcoin.co/grants/v1/api/vc/contributor_statistics");
    expect(gitcoin._options).toEqual({ threshold, receivingAttribute, recordAttribute });
  });
});
