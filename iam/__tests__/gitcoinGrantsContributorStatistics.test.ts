// ----- Libs
import axios from "axios";
import { GitcoinContributorStatisticsProvider } from "../src/providers/gitcoinGrantsContributorStatistics";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const githubAccessCode = "762165719dhiqudgasyuqwt6235";
const validCodeResponse = {
  data: {
    access_token: githubAccessCode,
  },
  status: 200,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });
});

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
