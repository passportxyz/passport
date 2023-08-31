// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { HypercertsProvider } from "../Hypercerts";

// ----- Libs
const mockedAxiosPost = jest.spyOn(axios, "post");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

// Mock current date
jest.spyOn(Date, "now").mockImplementation(() => 1677350400000); // This corresponds to "2023-01-25T00:00:00.000Z"

const mockGoodClaimTokens = [
  {
    claim: {
      creation: "1632189184",
      owner: MOCK_ADDRESS_LOWER,
      creator: "0x124",
    },
  },
  {
    claim: {
      creation: "1632189185",
      owner: MOCK_ADDRESS_LOWER,
      creator: "0x123",
    },
  },
];

const mockBadClaimTokens = [
  {
    claim: {
      creation: Math.floor(Date.now() / 1000).toString(),
      owner: MOCK_ADDRESS_LOWER,
      creator: "0x124",
    },
  },
  {
    claim: {
      creation: "1632189185",
      owner: MOCK_ADDRESS_LOWER,
      creator: MOCK_ADDRESS_LOWER,
    },
  },
];

// Mock Claim Tokens Response
const mockClaimTokensResponse = {
  data: {
    data: {
      claimTokens: [...mockGoodClaimTokens, ...mockBadClaimTokens],
    },
  },
};

describe("Hypercerts Provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxiosPost.mockResolvedValue(mockClaimTokensResponse);
  });

  it("should verify address with valid claims", async () => {
    const hypercertsProvider = new HypercertsProvider();
    const verifiedPayload = await hypercertsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });

    expect(mockedAxiosPost).toBeCalledTimes(1);
  });

  it("should handle invalid claims", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
      data: {
        data: {
          claimTokens: [],
        },
      },
    });

    const hypercertsProvider = new HypercertsProvider();
    const verifiedPayload = await hypercertsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["You have 0 valid Hypercerts and the minimum is 2."],
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });

    expect(mockedAxiosPost).toBeCalledTimes(1);
  });

  it("should handle claims older than 15 days", async () => {
    const hypercertsProvider = new HypercertsProvider();
    const verifiedPayload = await hypercertsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });

    expect(mockedAxiosPost).toBeCalledTimes(1);
  });

  it("should provide details about invalid claims when applicable", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
      data: {
        data: {
          claimTokens: [mockGoodClaimTokens[0], ...mockBadClaimTokens],
        },
      },
    });

    const hypercertsProvider = new HypercertsProvider();
    const verifiedPayload = await hypercertsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      errors: [
        "You have 1 valid Hypercerts and the minimum is 2. 1 Hypercerts were ignored because you created them yourself. 1 Hypercerts were ignored because they were created less than 15 days ago.",
      ],
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });

    expect(mockedAxiosPost).toBeCalledTimes(1);
  });
});
