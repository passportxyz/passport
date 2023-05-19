// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { CivicPassProvider } from "../Providers/civic";
import { CivicPassType } from "../Providers/passType";

const stubVerifyToken = jest.fn();
jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        verifyToken: stubVerifyToken,
      };
    }),
  };
});

const userAddress = "0x123";
const requestPayload = { address: userAddress } as RequestPayload;

describe("Civic Pass Provider", function () {
  beforeEach(() => {
    stubVerifyToken.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return valid false if no passes are found", async () => {
    const civic = new CivicPassProvider();
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
    });
  });

  it("should return valid true if a pass is found", async () => {
    stubVerifyToken.mockResolvedValue(true);
    const civic = new CivicPassProvider();
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
    });
  });

  it("should populate the error array if an error is thrown while checking any pass", async () => {
    stubVerifyToken.mockRejectedValue(new Error("some error"));
    const civic = new CivicPassProvider({
      passTypes: [CivicPassType.UNIQUENESS],
      chains: ["ETHEREUM_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
      error: ["some error"],
    });
  });

  it("should return the pass details if a pass is found", async () => {
    stubVerifyToken.mockResolvedValue(true);
    const civic = new CivicPassProvider({
      passTypes: [CivicPassType.UNIQUENESS],
      chains: ["ETHEREUM_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {
        UNIQUENESS: "ETHEREUM_MAINNET",
      },
    });
  });

  it("should return only the found passes", async () => {
    stubVerifyToken.mockResolvedValueOnce(false).mockResolvedValue(true);
    const civic = new CivicPassProvider({
      passTypes: [CivicPassType.UNIQUENESS],
      chains: ["ETHEREUM_MAINNET", "POLYGON_POS_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {
        UNIQUENESS: "POLYGON_POS_MAINNET",
      },
    });
  });

  it("should look for multiple pass types", async () => {
    stubVerifyToken.mockResolvedValue(true);
    const civic = new CivicPassProvider({
      passTypes: [CivicPassType.UNIQUENESS, CivicPassType.LIVENESS],
      chains: ["ETHEREUM_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {
        UNIQUENESS: "ETHEREUM_MAINNET",
        LIVENESS: "ETHEREUM_MAINNET",
      },
    });
  });
});
