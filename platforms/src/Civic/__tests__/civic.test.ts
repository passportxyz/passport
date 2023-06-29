// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { CivicPassProvider } from "../Providers/civic";
import { CivicPassType } from "../Providers/passType";
import { BigNumber } from "@ethersproject/bignumber";

const stubGetTokenIdsByOwnerAndNetwork = jest.fn();
const stubGetToken = jest.fn();

jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        getTokenIdsByOwnerAndNetwork: stubGetTokenIdsByOwnerAndNetwork,
        getToken: stubGetToken,
      };
    }),
  };
});

const userAddress = "0x123";
const requestPayload = { address: userAddress } as RequestPayload;
const expirySeconds = 1000;

describe("Civic Pass Provider", function () {
  beforeEach(() => {
    // return no passes by default
    stubGetTokenIdsByOwnerAndNetwork.mockResolvedValue([]);
    // if a pass is found, return a pass object
    stubGetToken.mockResolvedValue({
      expiration: BigNumber.from(Math.floor(Date.now() / 1000) + expirySeconds),
    });
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
    });
  });

  it("should return valid true if a pass is found", async () => {
    stubGetTokenIdsByOwnerAndNetwork.mockResolvedValue([1]);
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
    });
  });

  it("should set the expiry equal to the pass expiry", async () => {
    stubGetTokenIdsByOwnerAndNetwork.mockResolvedValue([1]);
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    const margin = 3;
    expect(verifiedPayload.expiresInSeconds).toBeGreaterThan(expirySeconds - margin);
  });

  it("should populate the error array if an error is thrown while checking any pass", async () => {
    stubGetTokenIdsByOwnerAndNetwork.mockRejectedValue(new Error("some error"));
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
      chains: ["ETHEREUM_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: false,
      error: ["some error"],
    });
  });

  it("should return the pass details if a pass is found", async () => {
    stubGetTokenIdsByOwnerAndNetwork.mockResolvedValue(true);
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
      chains: ["ETHEREUM_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {},
    });
  });

  it("should return the pass details if a pass is found on any chain", async () => {
    stubGetTokenIdsByOwnerAndNetwork.mockResolvedValueOnce(false).mockResolvedValue(true);
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.UNIQUENESS,
      chains: ["ETHEREUM_MAINNET", "POLYGON_POS_MAINNET"],
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
      record: {},
    });
  });
});
