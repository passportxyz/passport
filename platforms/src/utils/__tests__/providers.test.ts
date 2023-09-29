/* eslint-disable */
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { Providers } from "../providers";
import { SimpleProvider, verifySimpleProvider } from "../simpleProvider";

jest.spyOn(console, "error").mockImplementation(() => {});

describe("Providers", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContext: ProviderContext = {};

  const mockPayload: RequestPayload = {
    address: "0x0",
    proofs: {
      username: "test",
      valid: "true",
    },
    type: "Simple",
    version: "",
  };

  it("should report unexpected errors even if not derived from Error", async () => {
    (verifySimpleProvider as jest.MockedFunction<typeof verifySimpleProvider>) = jest.fn().mockImplementation(() => {
      throw "I don't have an error type";
    });

    const unknownErrorMessagePartOne = "UNHANDLED ERROR: for type Simple and address 0x0 -";
    const unknownErrorMessagePartTwo = "unable to parse, not derived from Error";

    const provider = new SimpleProvider();
    const providers = new Providers([provider]);
    const result = await providers.verify(mockPayload.type, mockPayload, mockContext);

    expect(console.error).toHaveBeenCalledWith(unknownErrorMessagePartOne, unknownErrorMessagePartTwo);
    expect(result).toEqual({
      valid: false,
      errors: ["There was an unexpected error during verification."],
    });
  });

  it("should report unexpected error details if derived from Error", async () => {
    (verifySimpleProvider as jest.MockedFunction<typeof verifySimpleProvider>) = jest.fn().mockImplementation(() => {
      class MyError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "MyError";
        }
      }
      throw new MyError("I'm an unhandled error");
    });

    const unknownErrorMessagePartOne = "UNHANDLED ERROR: for type Simple and address 0x0 -";

    const provider = new SimpleProvider();
    const providers = new Providers([provider]);
    const result = await providers.verify(mockPayload.type, mockPayload, mockContext);

    expect(console.error).toHaveBeenCalledWith(unknownErrorMessagePartOne, expect.stringContaining("MyError at"));

    expect(result).toEqual({
      valid: false,
      errors: [
        expect.stringContaining(
          "There was an unexpected error during verification. MyError: I'm an unhandled error at"
        ),
      ],
    });
  });

  it("should not report expected errors", async () => {
    (verifySimpleProvider as jest.MockedFunction<typeof verifySimpleProvider>) = jest.fn().mockImplementation(() => {
      throw new ProviderExternalVerificationError("I'm an expected error");
    });

    const provider = new SimpleProvider();
    const providers = new Providers([provider]);
    const result = await providers.verify(mockPayload.type, mockPayload, mockContext);

    expect(console.error).not.toHaveBeenCalled();

    expect(result).toEqual({
      valid: false,
      errors: ["I'm an expected error"],
    });
  });

  it("should return missing provider error if type doesn't exist", async () => {
    const provider = new SimpleProvider();
    const providers = new Providers([provider]);

    const result = await providers.verify("nonExistentType", mockPayload, mockContext);
    expect(result.valid).toEqual(false);
    expect(result.errors).toEqual(["Missing provider"]);
  });
});
