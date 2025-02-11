import axios from "axios";
import { checkCredentialBans } from "../src/bans";
import { ErrorResponseBody } from "@gitcoin/passport-types";
import { ApiError, UnexpectedApiError } from "../src/helpers";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("checkCredentialBans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCredential = {
    record: { type: "test" },
    credential: {
      credentialSubject: {
        nullifiers: ["hash123"],
        provider: "provider123",
        id: "did:0x123",
      },
    },
    code: 200,
  };

  const invalidCredential = {
    error: "Invalid credential",
    code: 400,
  };

  it("should return original response for invalid credentials", async () => {
    const input = [invalidCredential];
    const result = await checkCredentialBans(input);
    expect(result).toEqual(input);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should check bans for valid credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: false,
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/internal/check-bans"),
      [
        {
          credentialSubject: {
            hash: "hash123",
            provider: "provider123",
            id: "did:0x123",
          },
        },
      ],
      expect.any(Object)
    );
    expect(result).toEqual(input);
  });

  it("should handle banned credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: true,
          ban_type: "hash",
          reason: "Suspicious activity",
          end_time: "2024-12-31",
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(result).toEqual([
      {
        error: "Credential is banned. Type=hash, End=2024-12-31, Reason=Suspicious activity",
        code: 403,
      },
    ]);
  });

  it("should handle indefinite bans", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: true,
          ban_type: "account",
          reason: "Violation",
        },
      ],
    });

    const result = await checkCredentialBans([validCredential]);

    expect(result[0]).toEqual({
      error: `Credential is banned. Type=account, End=indefinite, Reason=Violation`,
      code: 403,
    });
  });

  it("should process multiple credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        { hash: "hash123", is_banned: true, ban_type: "hash" },
        { hash: "hash456", is_banned: false },
        { hash: "hash789", is_banned: false },
        { hash: "hashABC", is_banned: true, ban_type: "hash" },
      ],
    });

    const anotherValidCredential = JSON.parse(JSON.stringify(validCredential));
    anotherValidCredential.credential.credentialSubject.nullifiers = ["hash456"];

    const aThirdValidCredential = JSON.parse(JSON.stringify(validCredential));
    aThirdValidCredential.credential.credentialSubject.nullifiers = ["hash789", "hashABC"];

    const input = [validCredential, anotherValidCredential, aThirdValidCredential];
    const result = await checkCredentialBans(input);

    expect((result[0] as ErrorResponseBody).code).toBe(403);
    expect((result[1] as ErrorResponseBody).code).toBe(200);
    expect((result[2] as ErrorResponseBody).code).toBe(403);
  });

  it("should handle API errors gracefully", async () => {
    class MockAxiosError extends Error {
      response: { data: string; status: number; headers: { [key: string]: string } };
      request: string;
      constructor() {
        super("API Error");
        this.response = { data: "response", status: 500, headers: { TEST: "header" } };
        this.request = "request";
      }
      isAxiosError: true;
    }

    mockedAxios.post.mockImplementationOnce(() => {
      throw new MockAxiosError();
    });

    mockedAxios.isAxiosError.mockImplementationOnce((_: any) => {
      return true;
    });

    await expect(checkCredentialBans([validCredential])).rejects.toThrowError(
      new UnexpectedApiError(
        'Error making Bans request, received error response with code 500: "response", headers: {"TEST":"header"}'
      )
    );
  });

  it("should handle missing API response data", async () => {
    mockedAxios.post.mockResolvedValueOnce({});

    const input = [validCredential];

    await expect(checkCredentialBans(input)).rejects.toThrowError(
      new ApiError("Ban not found for nullifier hash123. This should not happen.", 500)
    );
  });
});
