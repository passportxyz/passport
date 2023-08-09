// TODO - Remove once ts lint has been unified across packages
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { ClearTextTwitterProvider } from "../Providers/clearTextTwitter";

import { RequestPayload } from "@gitcoin/passport-types";
import { getAuthClient, getTwitterUserData, TwitterUserData } from "../../Twitter/procedures/twitterOauth";

process.env.TWITTER_CLIENT_ID = "test_client_id";
process.env.TWITTER_CLIENT_SECRET = "test_client_secret";
process.env.TWITTER_CALLBACK = "test_callback";

jest.mock("../../Twitter/procedures/twitterOauth", () => ({
  getTwitterUserData: jest.fn(),
  getAuthClient: jest.fn(),
  initClientAndGetAuthUrl: jest.fn().mockReturnValue("mocked_url"),
  initCacheSession: jest.fn(),
  loadTwitterCache: jest.fn().mockReturnValue({}),
}));

const MOCK_TWITTER_USER: TwitterUserData = {
  id: "123",
  username: "DpoppDev",
};

const sessionKey = "twitter-myOAuthSession";
const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  getAuthClient as jest.Mock;
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
    (getTwitterUserData as jest.Mock).mockRejectedValue("unauthorized");

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
    (getAuthClient as jest.Mock).mockRejectedValue("unauthorized");
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
