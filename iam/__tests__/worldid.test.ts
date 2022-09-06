// ---- Test subject
import { WorldIDProvider, WORLD_ID_ACTION_ID } from "../src/providers/worldid";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_NULLIFIER_HASH = "0x2bf8406809dcefb1486dadc96c0a897db9bab002053054cf64272db512c6fbd8";

const validResponse = {
  data: {
    success: true,
    nullifier_hash: MOCK_NULLIFIER_HASH,
    return_url: "",
  },
  status: 200,
};

const invalidResponse = {
  data: {
    code: "invalid_proof",
    detail: "The provided proof is invalid and it cannot be verified. Please check all inputs and try again.",
    attribute: null as unknown,
  },
  status: 400,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validResponse;
  });
});

describe("attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const worldIDProvider = new WorldIDProvider();
    const verifyPayload = await worldIDProvider.verify({
      address: MOCK_ADDRESS,
      proofs: {
        nullifier_hash: MOCK_NULLIFIER_HASH,
        proof: "0x00000",
        merkle_root: "0x00000",
      },
    } as unknown as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://developer.worldcoin.org/api/v1/verify",
      {
        nullifier_hash: MOCK_NULLIFIER_HASH,
        merkle_root: "0x00000",
        proof: "0x00000",
        action_id: WORLD_ID_ACTION_ID,
        signal: MOCK_ADDRESS,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    expect(verifyPayload).toEqual({
      valid: true,
      record: {
        nullifier_hash: MOCK_NULLIFIER_HASH,
      },
    });
  });

  it("handles invalid proof attempt", async () => {
    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return invalidResponse;
    });

    const worldIDProvider = new WorldIDProvider();
    const verifyPayload = await worldIDProvider.verify({
      address: MOCK_ADDRESS,
      proofs: {
        nullifier_hash: MOCK_NULLIFIER_HASH,
        proof: "0x00001",
        merkle_root: "0x00001",
      },
    } as unknown as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      "https://developer.worldcoin.org/api/v1/verify",
      {
        nullifier_hash: MOCK_NULLIFIER_HASH,
        merkle_root: "0x00001",
        proof: "0x00001",
        action_id: WORLD_ID_ACTION_ID,
        signal: MOCK_ADDRESS,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    console.log(verifyPayload)

    expect(verifyPayload).toEqual({
      valid: false,
      error: [
        "The provided proof is invalid and it cannot be verified. Please check all inputs and try again."
      ]
    });
  });
});
