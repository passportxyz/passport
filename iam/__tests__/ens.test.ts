// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { EnsProvider } from "../src/providers/ens";

// ----- Ethers library
import { StaticJsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";

import { mock } from "jest-mock-extended";

jest.mock("@ethersproject/providers");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ENS = "dpopptest.eth";

const EthersLookupAddressMock = jest.spyOn(StaticJsonRpcProvider.prototype, "lookupAddress");
const EthersProviderResolveAddressMock = jest.spyOn(StaticJsonRpcProvider.prototype, "resolveName");
const EthersSignerResolveAddressMock = jest.spyOn(JsonRpcSigner.prototype, "resolveName")

const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    EthersLookupAddressMock.mockImplementation(async (address) => {
      if (address === MOCK_ADDRESS) return MOCK_ENS;
    });
    EthersProviderResolveAddressMock.mockImplementation(async (ens) => {
      if (ens === MOCK_ENS) return MOCK_ADDRESS;
    });
    EthersSignerResolveAddressMock.mockImplementation(async (ens) => {
      if (ens === MOCK_ENS) return MOCK_ADDRESS;
    });
  });

  it("should make evm request with signer if provided", async () => {
    const ens = new EnsProvider();
    const verifiedPayload = await ens.verify({
      signer: mockSigner,
    } as unknown as RequestPayload);

    expect(EthersSignerResolveAddressMock).toBeCalledWith(MOCK_ENS);
  })

  it("handles valid verification attempt", async () => {
    const ens = new EnsProvider();
    const verifiedPayload = await ens.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toBeCalledWith(MOCK_ADDRESS);
    expect(EthersProviderResolveAddressMock).toBeCalledWith(MOCK_ENS);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        ens: MOCK_ENS,
      },
    });
  });

  it("should return false for invalid address", async () => {
    EthersLookupAddressMock.mockRejectedValueOnce("Invalid Address");
    const ens = new EnsProvider();
    const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";

    const verifiedPayload = await ens.verify({
      address: MOCK_FAKE_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
    });
  });

  it("should return false for an address without a valid ens name", async () => {
    const ens = new EnsProvider();
    const MOCK_FAKE_ADDRESS = "0xd9FA0c2bF77750EE0C154875d1b6f06aa494668a";

    const verifiedPayload = await ens.verify({
      address: MOCK_FAKE_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({ valid: false, error: ["Ens name was not found for given address."] });
  });
});
