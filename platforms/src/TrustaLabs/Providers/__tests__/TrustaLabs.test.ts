/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { TrustaLabsProvider } from "../../Providers/TrustaLabs";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

const SCORER_BACKEND = process.env.PASSPORT_SCORER_BACKEND;

const validTrustaLabsResponse = {
  data: {
    data: {
      address: MOCK_ADDRESS_LOWER,
      sybilRiskScore: 20,
    },
    success: true,
    code: 0,
    message: ""
  },
};

const invalidTrustaLabsResponse = {
  data: {
    data: {
      address: MOCK_ADDRESS_LOWER,
      sybilRiskScore: 80,
    },
    success: true,
    code: 0,
    message: ""
  },
};

const emptyTrustaLabsResponse = {
  data: {
    data: {
      account: {},
    },
  },
};

const TRUSTA_LABS_API_ENDPOINT = "https://www.trustalabs.ai/service/openapi/queryRiskSummaryScore";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TrustaLabs", () => {
  it("handles valid verification attempt", async () => {
    // mockedAxios.post.mockResolvedValue(validTrustaLabsResponse);

    // const trustaLabsScore = new TrustaLabsProvider();
    // const verifiedPayload = await trustaLabsScore.verify({
    //   address: MOCK_ADDRESS,
    // } as unknown as RequestPayload);

    // expect(axios.post).toHaveBeenCalledTimes(2);

    // expect(verifiedPayload).toEqual({
    //   valid: true,
    //   record: {
    //     address: MOCK_ADDRESS_LOWER,
    //   },
    //   errors: []
    // });
  });
});
