import axios from "axios";
import { checkCredentialBans } from "../src/utils/bans";
import { ErrorResponseBody } from "@gitcoin/passport-types";

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
        hash: "hash123",
        provider: "provider123",
        address: "0x123",
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
          credential_id: "0",
          is_banned: false,
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/ceramic-cache/check-bans"),
      [
        {
          credential_id: "0",
          credentialSubject: {
            hash: "hash123",
            provider: "provider123",
            address: "0x123",
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
          credential_id: "0",
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
        error: `Credential is banned.
Type: hash
Reason: Suspicious activity
End time: 2024-12-31`,
        code: 403,
      },
    ]);
  });

  it("should handle indefinite bans", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          credential_id: "0",
          is_banned: true,
          ban_type: "account",
          reason: "Violation",
        },
      ],
    });

    const result = await checkCredentialBans([validCredential]);

    expect(result[0]).toEqual({
      error: `Credential is banned.
Type: account
Reason: Violation
End time: (indefinite)`,
      code: 403,
    });
  });

  it("should process multiple credentials in correct order", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        { credential_id: "0", is_banned: true, ban_type: "hash" },
        { credential_id: "1", is_banned: false },
      ],
    });

    const input = [validCredential, { ...validCredential }];
    const result = await checkCredentialBans(input);

    expect((result[0] as ErrorResponseBody).code).toBe(403);
    expect((result[1] as ErrorResponseBody).code).toBe(200);
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
      isAxiosError = true;
    }
    mockedAxios.post.mockImplementationOnce(() => {
      throw new MockAxiosError();
    });

    await expect(checkCredentialBans([validCredential])).rejects.toThrowError(
      'Error making Bans request, received error response with code 500: "response", headers: {"TEST":"header"}'
    );
  });

  it("should handle missing API response data", async () => {
    mockedAxios.post.mockResolvedValueOnce({});

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(result).toEqual(input);
  });
});
