// Verifies the HumanIdKycPlatform forwards kycOptions (including freeZKPassport)
// to privateRequestSBT — the central premise of Goal 1.
import { HumanIdKycPlatform } from "../App-Bindings.js";

const mockPrivateRequestSBT = jest.fn();
const mockGetKeygenMessage = jest.fn(() => "test-keygen-message");

jest.mock("@holonym-foundation/human-id-sdk", () => ({
  initHumanID: jest.fn(() => ({
    getKeygenMessage: mockGetKeygenMessage,
    privateRequestSBT: mockPrivateRequestSBT,
  })),
  setOptimismRpcUrl: jest.fn(),
  getKycSBTByAddress: jest.fn().mockRejectedValue(new Error("SBT not found")),
  getZkPassportSBTByAddress: jest.fn().mockRejectedValue(new Error("SBT not found")),
}));

// Block the off-chain attestation HTTP call by faking a 404.
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({ status: 404, data: { code: "NOT_FOUND" } })),
  },
}));

describe("HumanIdKycPlatform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrivateRequestSBT.mockResolvedValue({
      sbt: { recipient: "0xrecipient", txHash: "0xhash", chain: "Optimism" },
    });
  });

  it("forwards kycOptions with all three flags to privateRequestSBT", async () => {
    const platform = new HumanIdKycPlatform({});

    await platform.getProviderPayload({
      address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
      signMessageAsync: jest.fn(async () => "0xsignature"),
      sendTransactionAsync: jest.fn(),
      switchChainAsync: jest.fn(),
    } as any);

    expect(mockPrivateRequestSBT).toHaveBeenCalledTimes(1);
    const [credentialType, params] = mockPrivateRequestSBT.mock.calls[0];
    expect(credentialType).toBe("kyc");
    expect(params.kycOptions).toEqual({
      regularKYC: true,
      paidZKPassport: true,
      freeZKPassport: true,
    });
    expect(params.cleanHandsOptions).toBeUndefined();
    expect(params.signature).toBe("0xsignature");
  });
});
