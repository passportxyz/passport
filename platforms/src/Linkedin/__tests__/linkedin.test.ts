/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */
// ---- Test subject
import { LinkedinProvider } from "../../Linkedin/Providers/linkedin";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validLinkedinUserResponse = {
  data: {
    id: "18723656",
    firstName: "First",
    lastName: "Last",
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
    return validLinkedinUserResponse;
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const linkedin = new LinkedinProvider();
    const linkedinPayload = await linkedin.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${process.env.LINKEDIN_CALLBACK}`,
      {},
      {
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    // Check the request to get the user
    expect(mockedAxios.get).toHaveBeenCalledWith("https://api.linkedin.com/rest/me", {
      headers: { Authorization: "Bearer 762165719dhiqudgasyuqwt6235", "Linkedin-Version": 202305 },
    });

    expect(linkedinPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        id: validLinkedinUserResponse.data.id,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockRejectedValueOnce("bad request");

    const linkedin = new LinkedinProvider();

    await expect(
      async () =>
        await linkedin.verify({
          proofs: {
            code,
          },
        } as unknown as RequestPayload)
    ).rejects.toThrow("LinkedIn Account verification error: ");
  });

  it("should return invalid payload when there is no id in verifyLinkedin response", async () => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        data: {
          id: undefined,
          firstName: "First",
          lastName: "Last",
        },
        status: 200,
      };
    });

    const linkedin = new LinkedinProvider();

    const linkedinPayload = await linkedin.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(linkedinPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by linkedin user api", async () => {
    mockedAxios.get.mockRejectedValueOnce(async () => {
      return {
        status: 500,
      };
    });

    const linkedin = new LinkedinProvider();

    await expect(
      async () =>
        await linkedin.verify({
          proofs: {
            code,
          },
        } as unknown as RequestPayload)
    ).rejects.toThrow("LinkedIn Account verification error: ");
  });
});
