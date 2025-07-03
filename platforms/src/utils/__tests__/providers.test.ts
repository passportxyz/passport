/* eslint-disable */
import { RequestPayload, ProviderContext, VerifiedPayload, PROVIDER_ID } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types.js";
import { Providers, withTimeout } from "../providers.js";
import { SimpleProvider } from "../simpleProvider.js";
import { verifySimpleProvider } from "../simpleProviderVerifier.js";

jest.spyOn(console, "error").mockImplementation(() => {});

jest.useFakeTimers(); // Use Jest's timer mocks

jest.mock("../simpleProviderVerifier", () => {
  const originalModule = jest.requireActual("../simpleProviderVerifier");

  return {
    __esModule: true,
    ...originalModule,
    verifySimpleProvider: jest.fn(originalModule.verifySimpleProvider),
  };
});

describe("withTimeout", () => {
  beforeEach(() => {
    jest.spyOn(global, "clearTimeout");
  });
  it("should resolve with the correct value if the promise resolves before the timeout", async () => {
    const expectedValue = { valid: true };
    const fastPromise = new Promise((resolve) =>
      setTimeout(() => resolve(expectedValue), 1000)
    ) as Promise<VerifiedPayload>;

    const resultPromise = withTimeout(3000, fastPromise, "testType");
    jest.advanceTimersByTime(1000); // Fast-forward until all timers are executed

    await expect(resultPromise).resolves.toEqual(expectedValue);
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  it("should reject with a timeout error if the promise does not resolve in time", async () => {
    const slowPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ valid: true }), 5000)
    ) as Promise<VerifiedPayload>;

    const resultPromise = withTimeout(3000, slowPromise, "testType");
    const begin = new Date().getTime();
    jest.advanceTimersByTime(3001); // Fast-forward until the timeout should occur
    const end = new Date().getTime();

    await expect(resultPromise).rejects.toThrow(ProviderExternalVerificationError);
    await expect(resultPromise).rejects.toThrow(
      "Request timeout while verifying testType. It took over 3000 ms to complete."
    );
    // We expect 0 calls, because an error should have been thrown
    expect(clearTimeout).toHaveBeenCalledTimes(0);
  });
});

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
    (verifySimpleProvider as jest.Mock).mockImplementationOnce(() => {
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
    (verifySimpleProvider as jest.Mock).mockImplementationOnce(() => {
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
    (verifySimpleProvider as jest.Mock).mockImplementationOnce(() => {
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
