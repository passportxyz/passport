import { getRPCProvider } from "../../src/utils/signer";
import { mock } from "jest-mock-extended";
import { RequestPayload } from "@gitcoin/passport-types";

import { StaticJsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
const MOCK_ADDRESS = "0x6Cc41e662668C733c029d3c70E9CF248359ce544";

const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

describe("signer", () => {
  beforeEach(() => {
    mockSigner.getAddress = jest.fn(async () => MOCK_ADDRESS);
  });

  it("getRPCProvider should return signer", async () => {
    const payload = { jsonRpcSigner: mockSigner } as RequestPayload;
    const provider = await getRPCProvider(payload);
    expect(provider).toEqual({
      provider: mockSigner,
      address: MOCK_ADDRESS,
    });
  });

  it("getRPCProvider should return provider", async () => {
    const payload = {
      address: MOCK_ADDRESS,
      issuer: "did:key:z6MknoH3b2xBpjFRx2fYVqwLAcRCSXwEX3Y4XgwdGPDubwxt",
    } as RequestPayload;
    const provider = await getRPCProvider(payload);
    expect(provider).toEqual({
      provider: new StaticJsonRpcProvider(),
      address: MOCK_ADDRESS,
    });
  });
});
