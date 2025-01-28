// ---- Test subject
import { fetchChallengeCredential, fetchVerifiableCredential } from "../../utils/credentials";

import { vi, describe, it, expect } from "vitest";

// ---- Types
import axios from "axios";
import { RequestPayload } from "@gitcoin/passport-types";

const MOCK_CHALLENGE_VALUE = "this is a challenge";
const MOCK_CHALLENGE_CREDENTIAL = {
  credentialSubject: {
    challenge: "this is a challenge",
  },
};
const MOCK_CHALLENGE_RESPONSE_BODY = {
  credential: MOCK_CHALLENGE_CREDENTIAL,
};

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
    // your mocked methods
    default: {
      ...actual.default,
      post: vi.fn(async (url, data) => {
        if (url.endsWith("/challenge")) {
          return {
            data: MOCK_CHALLENGE_RESPONSE_BODY,
          };
        }

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

// this would need to be a valid key but we've mocked out didkit (and no verifications are made)
const key = "SAMPLE_KEY";

describe("Fetch Credentials", function () {
  const IAM_URL = "iam.example";
  const payload: RequestPayload = {
    address: "0x0",
    type: "Simple",
    version: "Test-Case-1",
  };

  const MOCK_SIGNED_PAYLOAD = {
    signatures: ["signature"],
    payload: "0x123",
    cid: ["0x456"],
    cacao: ["0x789"],
    issuer: "0x0",
  };

  const MOCK_CREATE_SIGNED_PAYLOAD = vi.fn().mockImplementation(() => Promise.resolve(MOCK_SIGNED_PAYLOAD));

  const IAM_CHALLENGE_ENDPOINT = `${IAM_URL}/v${payload.version}/challenge`;
  const expectedChallengeRequestBody = { payload: { address: payload.address, type: payload.type } };

  const IAM_VERIFY_ENDPOINT = `${IAM_URL}/v${payload.version}/verify`;
  const expectedVerifyRequestBody = {
    payload: {
      ...payload,
    },
    signedChallenge: MOCK_SIGNED_PAYLOAD,
    challenge: MOCK_CHALLENGE_CREDENTIAL,
  };

  beforeEach(() => {
    MOCK_CREATE_SIGNED_PAYLOAD.mockClear();
    clearAxiosMocks();
  });

  it("can fetch a challenge credential", async () => {
    const { challenge: actualChallenge } = await fetchChallengeCredential(IAM_URL, payload);

    // check that called the axios.post fn
    expect(axios.post).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    expect(actualChallenge).toEqual(MOCK_CHALLENGE_CREDENTIAL);
  });

  it("can fetch a verifiable credential", async () => {
    const { credentials } = await fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD);

    // called to fetch the challenge and to verify
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(1, IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    expect(axios.post).toHaveBeenNthCalledWith(2, IAM_VERIFY_ENDPOINT, expectedVerifyRequestBody);

    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalled();
    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalledWith(MOCK_CHALLENGE_VALUE);

    expect(credentials).toEqual([MOCK_VERIFY_RESPONSE_BODY]);
  });

  it("will throw if signer rejects request for signature", async () => {
    // if the user rejects the signing then the signer will throw an error...
    MOCK_CREATE_SIGNED_PAYLOAD.mockImplementation(async () => {
      throw new Error("Unable to sign");
    });

    await expect(fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD)).rejects.toThrow(
      "Unable to sign"
    );
    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalled();
  });

  it("will not attempt to sign if not provided a challenge in the challenge credential", async () => {
    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        credential: {
          credentialSubject: {
            challenge: null,
          },
        },
      },
    });

    await expect(fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD)).rejects.toThrow(
      "Unable to sign message"
    );

    expect(axios.post).toHaveBeenNthCalledWith(1, IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    // NOTE: the signMessage function was never called
    expect(MOCK_CREATE_SIGNED_PAYLOAD).not.toBeCalled();
  });
});
