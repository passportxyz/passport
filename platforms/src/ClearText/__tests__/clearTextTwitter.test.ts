// TODO - Remove once ts lint has been unified across packages
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { ClearTextTwitterProvider } from "../Providers/clearTextTwitter";

import { RequestPayload } from "@gitcoin/passport-types";
import { TwitterApi } from "twitter-api-v2";
import { getAuthClient, getTwitterUserData, TwitterUserData } from "../../Twitter/procedures/twitterOauth";
import { ProviderExternalVerificationError } from "../../types";

jest.mock("../../Twitter/procedures/twitterOauth", () => ({
  getAuthClient: jest.fn(),
  getTwitterUserData: jest.fn(),
}));

const MOCK_TWITTER_CLIENT = new TwitterApi().readOnly;

const MOCK_TWITTER_USER: TwitterUserData = {
  id: "123",
  username: "DpoppDev",
  createdAt: "2019-01-01T00:00:00Z",
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthClient as jest.Mock).mockReturnValue(MOCK_TWITTER_CLIENT);
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    (getTwitterUserData as jest.Mock).mockResolvedValue(MOCK_TWITTER_USER);

    const twitter = new ClearTextTwitterProvider();
    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(getAuthClient).toBeCalledWith(sessionKey, code, {});
    expect(getTwitterUserData).toBeCalled();
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        pii: MOCK_TWITTER_USER.username,
      },
    });
  });

  it("should return invalid payload when there is no username in getTwitterUserData response", async () => {
    (getTwitterUserData as jest.Mock).mockResolvedValue({ username: undefined } as TwitterUserData);

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when getTwitterUserData throws", async () => {
    (getTwitterUserData as jest.Mock).mockRejectedValue(new ProviderExternalVerificationError("Error"));

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when unable to retrieve twitter oauth client", async () => {
    (getAuthClient as jest.Mock).mockRejectedValue(new ProviderExternalVerificationError("Error"));
    (getTwitterUserData as jest.Mock).mockImplementationOnce(async (client) => {
      return client ? MOCK_TWITTER_USER : {};
    });

    const twitter = new ClearTextTwitterProvider();

    const verifiedPayload = await twitter.verify(
      {
        proofs: {
          sessionKey,
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toMatchObject({ valid: false });
  });
});
