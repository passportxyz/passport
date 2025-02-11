import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../src/utils/attestations.js", () => ({
  getAttestationSignerForChain: jest.fn(),
  getAttestationDomainSeparator: jest.fn(),
  ATTESTER_TYPES: {
    AttestationRequestData: [
      { name: "recipient", type: "address" },
      { name: "expirationTime", type: "uint64" },
      { name: "revocable", type: "bool" },
      { name: "refUID", type: "bytes32" },
      { name: "data", type: "bytes" },
      { name: "value", type: "uint256" },
    ],
    MultiAttestationRequest: [
      { name: "schema", type: "bytes32" },
      { name: "data", type: "AttestationRequestData[]" },
    ],
    PassportAttestationRequest: [
      { name: "multiAttestationRequest", type: "MultiAttestationRequest[]" },
      { name: "nonce", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
}));

jest.unstable_mockModule("@gitcoin/passport-identity", () => ({
  hasValidIssuer: jest.fn(() => true),
  verifyCredential: jest.fn(async () => Promise.resolve(true)),
}));

jest.unstable_mockModule("../src/utils/easFees.js", () => ({
  getEASFeeAmount: jest.fn(),
}));

jest.unstable_mockModule("../src/utils/ethersHelper.js", async () => {
  const originalModule = await import("ethers");
  return {
    ...originalModule,
    Contract: jest.fn(),
  };
});

import { Request, Response } from "express";

const { getEASFeeAmount } = await import("../src/utils/easFees.js");
const { hasValidIssuer } = await import("@gitcoin/passport-identity");
const { Signature, Contract } = await import("../src/utils/ethersHelper.js");
const { scrollDevBadgeHandler, getScrollRpcUrl } = await import("../src/utils/scrollDevBadge.js");
const { getAttestationSignerForChain } = await import("../src/utils/attestations.js");

describe("scrollDevBadgeHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    const mockSigner = {
      signTypedData: jest.fn().mockResolvedValue("0xSignature"),
    };
    (getAttestationSignerForChain as jest.Mock).mockResolvedValue(mockSigner);

    (hasValidIssuer as jest.Mock).mockReturnValue(true);

    (getEASFeeAmount as jest.Mock).mockReturnValue(1234);

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
    mockReq = {
      body: {
        credentials: [],
        nonce: "123",
        chainIdHex: "0x82750",
      },
    };

    // Mock environment variables
    process.env.SCROLL_BADGE_PROVIDER_INFO = JSON.stringify({
      "test-provider": {
        contractAddress: "0x1234567890123456789012345678901234567890",
        level: 1,
      },
    });
    process.env.SCROLL_BADGE_ATTESTATION_SCHEMA_UID = "0xSchema";
    process.env.ALCHEMY_API_KEY = "test-api-key";

    (Contract as unknown as jest.Mock).mockImplementation(() => ({
      badgeLevel: jest.fn().mockResolvedValue(BigInt(0)),
    }));
  });

  it("should return an error if no credentials are provided", async () => {
    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "No stamps provided" });
  });

  it("should return an error if the recipient is invalid", async () => {
    mockReq.body.credentials = [{ credentialSubject: { id: "invalid:id" } }];
    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid recipient" });
  });

  it("should process valid credentials and return a signed payload", async () => {
    const mockCredential = {
      credentialSubject: {
        id: "did:pkh:eip155:1:0x1234567890123456789012345678901234567890",
        provider: "test-provider",
        hash: "v0.0.0:JnHtXuRm2roGRwbYfHtWYSwMma3Oeh3yUl3hmZ3k96U=",
      },
      issuer: "did:key:test",
    };
    mockReq.body.credentials = [mockCredential];

    // Mock the necessary functions
    jest.spyOn(Signature, "from").mockReturnValue({ v: 27, r: "0xr", s: "0xs" } as any);

    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockJson).toHaveBeenCalled();
    const response = mockJson.mock.calls[0][0];
    expect(response).toHaveProperty("passport");
    expect(response).toHaveProperty("signature");
    expect(response.signature).toEqual({ v: 27, r: "0xr", s: "0xs" });
  });
});

describe("getScrollRpcUrl", () => {
  it("should return the correct mainnet URL", () => {
    const url = getScrollRpcUrl({ chainIdHex: "0x82750" });
    expect(url).toBe("https://scroll-mainnet.g.alchemy.com/v2/test-api-key");
  });

  it("should return the correct sepolia URL", () => {
    const url = getScrollRpcUrl({ chainIdHex: "0x1234" });
    expect(url).toBe("https://scroll-sepolia.g.alchemy.com/v2/test-api-key");
  });
});
