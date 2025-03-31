import axios from "axios";
import { checkCredentialBans } from "../src/bans";
import { ErrorResponseBody } from "@gitcoin/passport-types";
import { ApiError, InternalApiError } from "../src/serverUtils/apiError";

jest.mock("axios");

const mockedAxiosPost = axios.post as jest.Mock;
const mockedIsAxiosError = axios.isAxiosError as unknown as jest.Mock;

describe("checkCredentialBans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCredential = {
    record: { type: "test", version: "0.0.0" },
    credential: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      credentialSubject: {
        "@context": {
          nullifiers: {
            "@container": "@list",
            "@type": "https://schema.org/Text",
          },
        },
        nullifiers: ["hash123"] as string[] | undefined,
        hash: undefined as string | undefined,
        provider: "provider123",
        id: "did:0x123",
      },
      type: ["VerifiableCredential"],
      issuer: "did:0x123",
      issuanceDate: "2021-01-01",
      expirationDate: "2022-01-01",
      proof: {} as any,
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
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });

  it("should check bans for valid credentials", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: false,
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(mockedAxiosPost).toHaveBeenCalledWith(
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
    mockedAxiosPost.mockResolvedValueOnce({
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
    mockedAxiosPost.mockResolvedValueOnce({
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
    mockedAxiosPost.mockResolvedValueOnce({
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

  it("should fall back to credential hashes", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
      data: [
        { hash: "hash123", is_banned: true, ban_type: "hash" },
        { hash: "hash456", is_banned: false },
      ],
    });

    const credential1 = JSON.parse(JSON.stringify(validCredential));

    delete credential1.credential.credentialSubject.nullifiers;
    expect(credential1.credential.credentialSubject.nullifiers).toBeUndefined();

    credential1.credential.credentialSubject.hash = "hash123";

    const credential2 = JSON.parse(JSON.stringify(credential1));
    credential2.credential.credentialSubject.hash = "hash456";

    const input = [credential1, credential2];
    const result = await checkCredentialBans(input);

    expect((result[0] as ErrorResponseBody).code).toBe(403);
    expect((result[1] as ErrorResponseBody).code).toBe(200);
  });

  it("should handle API errors gracefully", async () => {
    class MockAxiosError extends Error {
      response: {
        data: string;
        status: number;
        headers: { [key: string]: string };
      };
      request: string;
      constructor() {
        super("API Error");
        this.response = {
          data: "response",
          status: 500,
          headers: { TEST: "header" },
        };
        this.request = "request";
      }
      isAxiosError: true;
    }

    mockedAxiosPost.mockImplementationOnce(() => {
      throw new MockAxiosError();
    });

    mockedIsAxiosError.mockImplementationOnce((_: any) => {
      return true;
    });

    await expect(checkCredentialBans([validCredential])).rejects.toThrowError(
      new InternalApiError(
        'Error making Bans request, received error response with code 500: "response", headers: {"TEST":"header"}'
      )
    );
  });

  it("should handle missing API response data", async () => {
    mockedAxiosPost.mockResolvedValueOnce({});

    const input = [validCredential];

    await expect(checkCredentialBans(input)).rejects.toThrowError(
      new ApiError("Ban not found for nullifier hash123. This should not happen.", "500_SERVER_ERROR")
    );
  });
});
