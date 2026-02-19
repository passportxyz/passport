// ---- Test subject
import { fetchVerifiableCredential } from "../../utils/credentials";

import { vi, describe, it, expect } from "vitest";

// ---- Types
import axios from "axios";
import { RequestPayload } from "@gitcoin/passport-types";

// IAM verify response
const MOCK_VERIFY_RESPONSE_BODY = {
  credential: { type: ["VerifiableCredential"] },
  record: {
    type: "test",
    address: "0xmyAddress",
  },
};

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(async (url, data) => {
        if (url.endsWith("/verify")) {
          return {
            data: MOCK_VERIFY_RESPONSE_BODY,
          };
        }

        throw Error("This endpoint is not set up!");
      }),
    },
  };
});

const clearAxiosMocks = () => {
  vi.clearAllMocks();
};

describe("Fetch Credentials", function () {
  const IAM_URL = "iam.example";
  const payload: RequestPayload = {
    address: "0x0",
    type: "Simple",
    version: "Test-Case-1",
  };

  const DB_ACCESS_TOKEN = "test-jwt-token";

  const IAM_VERIFY_ENDPOINT = `${IAM_URL}/v${payload.version}/verify`;

  beforeEach(() => {
    clearAxiosMocks();
  });

  it("can fetch a verifiable credential with JWT auth", async () => {
    const { credentials } = await fetchVerifiableCredential(IAM_URL, payload, DB_ACCESS_TOKEN);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      IAM_VERIFY_ENDPOINT,
      { payload },
      {
        headers: {
          Authorization: `Bearer ${DB_ACCESS_TOKEN}`,
        },
      }
    );

    expect(credentials).toEqual([MOCK_VERIFY_RESPONSE_BODY]);
  });

  it("handles array response from IAM", async () => {
    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: [MOCK_VERIFY_RESPONSE_BODY, MOCK_VERIFY_RESPONSE_BODY],
    });

    const { credentials } = await fetchVerifiableCredential(IAM_URL, payload, DB_ACCESS_TOKEN);

    expect(credentials).toEqual([MOCK_VERIFY_RESPONSE_BODY, MOCK_VERIFY_RESPONSE_BODY]);
  });

  it("will throw if the request fails", async () => {
    vi.spyOn(axios, "post").mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchVerifiableCredential(IAM_URL, payload, DB_ACCESS_TOKEN)).rejects.toThrow("Network error");
  });
});
