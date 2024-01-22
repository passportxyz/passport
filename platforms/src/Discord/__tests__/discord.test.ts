// TODO - remove eslint disable below once type rules are unified
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */
// ---- Test subject
import { DiscordProvider } from "../Providers/discord";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validDiscordUserResponse = {
  data: {
    user: {
      id: "268473310986240001",
      username: "Discord",
      avatar: "f749bb0cbeeb26ef21eca719337d20f1",
      discriminator: "0001",
      public_flags: 131072,
    },
  },
  status: 200,
};

const validCodeResponse = {
  data: {
    access_token: "762165719dhiqudgasyuqwt6235",
  },
  status: 200,
};

const code = "ABC123_ACCESSCODE";

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async () => {
    return validCodeResponse;
  });

  mockedAxios.get.mockImplementation(async () => {
    return validDiscordUserResponse;
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const discord = new DiscordProvider();
    const discordPayload = await discord.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    // Check the request to get the user
    expect(mockedAxios.get).toHaveBeenCalledWith("https://discord.com/api/oauth2/@me", {
      headers: { Authorization: "Bearer 762165719dhiqudgasyuqwt6235" },
    });

    expect(discordPayload).toEqual({
      valid: true,
      record: {
        id: validDiscordUserResponse.data.user.id,
      },
      errors: [],
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return {
        status: 500,
      };
    });

    const discord = new DiscordProvider();

    await expect(async () => {
      return await discord.verify({
        proofs: {
          code,
        },
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "Discord account check error: Post for request returned status code 500 instead of the expected 200"
      )
    );
  });

  it("should return invalid payload when there is no id in verifyDiscord response", async () => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        data: {
          id: undefined,
          login: "my-login-handle",
          type: "User",
        },
        status: 200,
      };
    });

    const discord = new DiscordProvider();

    const discordPayload = await discord.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(discordPayload).toMatchObject({
      valid: false,
      errors: ["We were not able to verify a Discord account with your provided credentials."],
      record: undefined,
    });
  });

  it("should return invalid payload when a bad status code is returned by discord user api", async () => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        status: 500,
      };
    });

    const discord = new DiscordProvider();

    await expect(async () => {
      return await discord.verify({
        proofs: {
          code,
        },
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "Discord account check error: ProviderExternalVerificationError: Get user request returned status code 500 instead of the expected 200"
      )
    );
  });
});
