import { RequestPayload } from "@gitcoin/passport-types";
import { CivicPassProvider } from "../Providers/civic.js";
import { CivicPassLookupPass, CivicPassType, PassesForAddress } from "../Providers/types.js";
import axios from "axios";

// Mock out all top level functions, such as get, put, delete and post:
jest.mock("axios");

const stubCivic = (passes: PassesForAddress["passes"]): void => {
  (axios.get as jest.Mock).mockResolvedValue({
    data: {
      userAddress: { passes },
    },
  });
};

const now = Math.floor(Date.now() / 1000);

const userAddress = "0x123";
const requestPayload = { address: userAddress } as RequestPayload;
const expirySeconds = 1000;
const dummyPass: CivicPassLookupPass = {
  chain: "ETHEREUM_MAINNET",
  expiry: now + expirySeconds,
  state: "ACTIVE",
  type: {
    slotId: "0x00",
    address: userAddress,
  },
  identifier: "0x456",
};

describe("Civic Pass Provider", function () {
  beforeEach(() => {
    // return no passes by default
    stubCivic({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return valid false if no passes are found", async () => {
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["You do not have a UNIQUENESS pass."],
    });
  });

  it("should return detailed error for an expired pass", async () => {
    const expiredPass = { ...dummyPass, expiry: now - 1 };

    stubCivic({
      UNIQUENESS: [expiredPass],
    });

    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });

    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["Your UNIQUENESS pass is expired."],
    });
  });

  it("should return detailed error for a revoked pass", async () => {
    const revokedPass = { ...dummyPass };
    revokedPass.state = "REVOKED";

    stubCivic({
      UNIQUENESS: [revokedPass],
    });

    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });

    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["Your UNIQUENESS pass is frozen or revoked."],
    });
  });

  it("should return valid true if a pass is found", async () => {
    stubCivic({
      UNIQUENESS: [dummyPass],
    });
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: { address: userAddress },
    });
  });

  it("should set the expiry equal to the pass expiry", async () => {
    stubCivic({
      UNIQUENESS: [dummyPass],
    });
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    const margin = 3;
    expect(verifiedPayload.expiresInSeconds).toBeGreaterThan(expirySeconds - margin);
  });

  it("should return the pass details if a pass is found", async () => {
    stubCivic({
      UNIQUENESS: [dummyPass],
    });
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {},
    });
  });

  it("should return the pass details if a pass is found on any chain", async () => {
    stubCivic({
      UNIQUENESS: [dummyPass, { ...dummyPass, chain: "POLYGON_POS_MAINNET" }],
    });
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {},
    });
  });

  describe("deprecation", () => {
    it("should return deprecation error for CAPTCHA pass after July 1, 2025", async () => {
      // Mock a date after July 1, 2025
      const deprecatedDate = new Date("2025-07-02");
      jest.useFakeTimers();
      jest.setSystemTime(deprecatedDate);

      stubCivic({
        CAPTCHA: [dummyPass],
      });

      const civic = new CivicPassProvider({
        type: "CivicCaptchaPass",
        passType: CivicPassType.CAPTCHA,
      });

      const verifiedPayload = await civic.verify(requestPayload);

      expect(verifiedPayload).toMatchObject({
        valid: false,
        errors: ["The Civic CAPTCHA Pass has been retired as of July 1, 2025."],
      });

      jest.useRealTimers();
    });

    it("should return deprecation error for UNIQUENESS pass after July 31, 2025", async () => {
      // Mock a date after July 31, 2025
      const deprecatedDate = new Date("2025-08-01");
      jest.useFakeTimers();
      jest.setSystemTime(deprecatedDate);

      stubCivic({
        UNIQUENESS: [dummyPass],
      });

      const civic = new CivicPassProvider({
        type: "CivicUniquenessPass",
        passType: CivicPassType.UNIQUENESS,
      });

      const verifiedPayload = await civic.verify(requestPayload);

      expect(verifiedPayload).toMatchObject({
        valid: false,
        errors: ["The Civic UNIQUENESS Pass has been retired as of July 31, 2025."],
      });

      jest.useRealTimers();
    });

    it("should return deprecation error for LIVENESS pass after July 31, 2025", async () => {
      // Mock a date after July 31, 2025
      const deprecatedDate = new Date("2025-08-01");
      jest.useFakeTimers();
      jest.setSystemTime(deprecatedDate);

      stubCivic({
        LIVENESS: [dummyPass],
      });

      const civic = new CivicPassProvider({
        type: "CivicLivenessPass",
        passType: CivicPassType.LIVENESS,
      });

      const verifiedPayload = await civic.verify(requestPayload);

      expect(verifiedPayload).toMatchObject({
        valid: false,
        errors: ["The Civic LIVENESS Pass has been retired as of July 31, 2025."],
      });

      jest.useRealTimers();
    });

    it("should allow CAPTCHA pass before July 1, 2025", async () => {
      // Mock a date before July 1, 2025
      const beforeDeprecationDate = new Date("2025-06-30");
      jest.useFakeTimers();
      jest.setSystemTime(beforeDeprecationDate);

      // Create a pass that will be valid in 2025
      const futureExpiry = Math.floor(beforeDeprecationDate.getTime() / 1000) + expirySeconds;
      const captchaPass = { ...dummyPass, expiry: futureExpiry };

      stubCivic({
        CAPTCHA: [captchaPass],
      });

      const civic = new CivicPassProvider({
        type: "CivicCaptchaPass",
        passType: CivicPassType.CAPTCHA,
      });

      const verifiedPayload = await civic.verify(requestPayload);

      expect(axios.get).toHaveBeenCalled();
      expect(verifiedPayload).toMatchObject({
        valid: true,
        record: { address: userAddress },
      });

      jest.useRealTimers();
    });
  });
});
