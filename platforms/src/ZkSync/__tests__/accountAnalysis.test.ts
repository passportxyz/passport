import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  ZkSyncScore20Provider,
  ZkSyncScore50Provider,
  ModelResponse,
  getZkSyncAnalysis,
  ZkSyncScore5Provider,
} from "../Providers/accountAnalysis";

const mockAddress = "0x0";
let mockContext = {};
const mockResponse = (score: number): { data: ModelResponse } => ({
  data: {
    data: {
      human_probability: score,
    },
  },
});

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const scoreTestCases = [
  //[score, [result for ZkSyncScore5Provider, result for ZkSyncScore20Provider, result for ZkSyncScore50Provider]]
  [0, [false, false, false]],
  [1, [false, false, false]],
  [5, [true, false, false]],
  [20, [true, true, false]],
  [50, [true, true, true]],
  [100, [true, true, true]],
]
  .map(([score, expected]: [number, boolean[]]) => {
    return [
      [score, expected[0], ZkSyncScore5Provider],
      [score, expected[1], ZkSyncScore20Provider],
      [score, expected[2], ZkSyncScore50Provider],
    ];
  })
  .flat() as [
  number,
  boolean,
  typeof ZkSyncScore5Provider | typeof ZkSyncScore20Provider | typeof ZkSyncScore50Provider,
][];

describe("AccountAnalysis Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {};
  });

  describe("should return valid/invalid based on score", () => {
    it.each(scoreTestCases)("score %i should return %s for %p", async (score, expected, provider) => {
      const mockedResponse = mockResponse(score);
      mockedAxios.post.mockResolvedValueOnce(mockedResponse);
      const ethAdvocateProvider = new provider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(expected);
      if (expected) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(payload.record).toEqual({ address: mockAddress });
      }
    });
  });

  it("should handle errors gracefully", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockRejectedValueOnce(new Error("Test Error"));
    const ethAdvocateProvider = new ZkSyncScore50Provider();
    await expect(ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext)).rejects.toThrow();
  });
  describe("getZkSyncAnalysis", () => {
    it("should use value from context if present", async () => {
      const mockedResponse = mockResponse(80);
      mockedAxios.post.mockResolvedValueOnce(mockedResponse);
      mockContext = {};
      const response1 = await getZkSyncAnalysis(mockAddress, mockContext);
      const response2 = await getZkSyncAnalysis(mockAddress, mockContext);
      expect(response1.humanProbability).toEqual(80);
      expect(response2.humanProbability).toEqual(80);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
