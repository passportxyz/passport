/* eslint-disable */
import { ProofOfPassportProvider } from "../Providers/proofOfPassport";
import { getTokenBalance } from "../Providers/utils";
import { RequestPayload } from "@gitcoin/passport-types";

jest.mock("../Providers/utils", () => ({
  getTokenBalance: jest.fn(),
}));

const MOCK_ADDRESS = "0x3336A5a627672A39967efa3Cd281e8e08E235ce2";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

beforeEach(() => {
  jest.clearAllMocks();
});

const mockTokenAddress = "0x5550ab114E3cf857b5bDd195eA9f753FAFd1cA91";

describe("ProofOfPassportProvider Tests", () => {
  let proofOfPassportProvider: ProofOfPassportProvider;

  beforeEach(() => {
    proofOfPassportProvider = new ProofOfPassportProvider({
      threshold: 1,
      recordAttribute: "tokenCount",
      contractAddress: mockTokenAddress,
      decimalNumber: 0,
      error: "Token balance fetch error",
    });
  });

  it("should verify token balance is above threshold", async () => {
    (getTokenBalance as jest.Mock).mockResolvedValueOnce(1);

    const result = await proofOfPassportProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(result.valid).toBe(true);
    expect(result.record).toEqual({
      address: MOCK_ADDRESS_LOWER,
    });
  });

  it("should reverse with a balance of 0", async () => {
    (getTokenBalance as jest.Mock).mockResolvedValueOnce(0);

    const result = await proofOfPassportProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(result.valid).toBe(false);
  });
});
