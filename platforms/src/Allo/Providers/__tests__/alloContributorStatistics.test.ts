// ----- Libs
import { AlloContributorStatisticsProvider } from "../alloContributorStatistics";
/* eslint-disable no-use-before-define */
describe("AlloContributorStatisticsProvider class", function () {
  it("should be properly initialized", function () {
    const threshold = 193;
    const receivingAttribute = "aaa";
    const recordAttribute = "bbb";
    const gitcoin = new AlloContributorStatisticsProvider({
      threshold,
      receivingAttribute,
      recordAttribute,
    });

    expect(gitcoin.type).toEqual(`AlloContributorStatistics#${recordAttribute}#${threshold}`);
    expect(gitcoin.urlPath).toEqual("/allo/contributor_statistics");
    expect(gitcoin._options).toEqual({ threshold, receivingAttribute, recordAttribute });
  });
});
