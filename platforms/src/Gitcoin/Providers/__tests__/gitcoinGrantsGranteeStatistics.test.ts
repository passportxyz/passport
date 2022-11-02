// ----- Libs
import { GitcoinGranteeStatisticsProvider } from "../gitcoinGrantsGranteeStatistics";
/* eslint-disable no-use-before-define */
describe("GitcoinGranteeStatisticsProvider class", function () {
  it("should be properly initialized", function () {
    const threshold = 193;
    const receivingAttribute = "aaa";
    const recordAttribute = "bbb";
    const gitcoin = new GitcoinGranteeStatisticsProvider({
      threshold,
      receivingAttribute,
      recordAttribute,
    });

    expect(gitcoin.type).toEqual(`GitcoinGranteeStatistics#${recordAttribute}#${threshold}`);
    expect(gitcoin.dataUrl).toEqual("https://gitcoin.co/grants/v1/api/vc/grantee_statistics");
    expect(gitcoin._options).toEqual({ threshold, receivingAttribute, recordAttribute });
  });
});
