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
});
