/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { TrustaLabsProvider } from "../../Providers/TrustaLabs.js";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

const makeResponse = (score: number) => ({
  data: {
    data: {
      address: MOCK_ADDRESS_LOWER,
      sybilRiskScore: score,
    },
    success: true,
    code: 0,
    message: "",
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TrustaLabs", () => {
  it.each([
    [20, true],
    [30.000045668, true],
    [60, true],
    [80, false],
    [-1, true],
    [-2, false],
  ])("should return %s for score %s", async (score: number, expected: boolean) => {
    mockedAxios.post.mockResolvedValue(makeResponse(score));

    const trustaLabs = new TrustaLabsProvider();
    const verifiedPayload = await trustaLabs.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(2);

    const { valid, record, errors } = verifiedPayload;
    if (expected) {
      expect(valid).toBe(true);
      expect(record).toEqual({ address: MOCK_ADDRESS });
      expect(errors).toEqual([]);
    } else {
      expect(valid).toBe(false);
      expect(errors).toEqual([`Sybil score ${score} is outside of the allowed range (-1 to 60)`]);
    }
  });
});
