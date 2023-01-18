// TODO - remove lint skip once types are unified
/* eslint-disable @typescript-eslint/require-await */
import { BrightidPlatform } from "../App-Bindings";
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validResponse = { data: { response: { valid: true } } };
const invalidResponse = { data: { response: { valid: false } } };

describe("BrightidPlatform", () => {
  it("should be able to verify a contextId", async () => {
    mockedAxios.post.mockImplementation(async (url) => {
      switch (url) {
        case `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/verifyContextId`:
          return validResponse;
        default:
          return {
            status: 404,
          };
      }
    });
    const platform = new BrightidPlatform();
    const result = await platform.getBrightidInfoForUserDid("did:brightid:0x123");
    expect(result).toBe(true);
  });

  it("should be able to get a provider payload", async () => {
    mockedAxios.post.mockImplementation(async (url) => {
      switch (url) {
        case `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/verifyContextId`:
          return invalidResponse;
        case `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`:
          return validResponse;
        default:
          return {
            status: 404,
          };
      }
    });

    const result = await new BrightidPlatform().getProviderPayload({
      state: "string",
      window: {
        open: jest.fn(),
      },
      screen: {
        width: 1,
        height: 1,
      },
      userDid: "string",
      callbackUrl: "string",
      waitForRedirect: async () =>
        Promise.resolve({
          state: "brightId",
        }),
    });

    expect(result).toEqual({ code: "success", sessionKey: "brightId" });
  });
});
