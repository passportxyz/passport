// ----- Libs
import { GitcoinContributorStatisticsProvider } from "../gitcoinGrantsContributorStatistics";
/* eslint-disable no-use-before-define */
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
    expect(gitcoin.urlPath).toEqual("/contributor_statistics");
    expect(gitcoin._options).toEqual({ threshold, receivingAttribute, recordAttribute });
  });
});
