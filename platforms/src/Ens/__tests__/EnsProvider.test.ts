// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { EnsProvider } from "../Providers/EnsProvider";

// ----- Ethers library
import { StaticJsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";

import { mock } from "jest-mock-extended";

jest.mock("@ethersproject/providers");

const MOCK_ADDRESS = "0x6Cc41e662668C733c029d3c70E9CF248359ce544";
const MOCK_ENS = "dpopptest.eth";

const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const EthersLookupAddressMock = jest.spyOn(StaticJsonRpcProvider.prototype, "lookupAddress");
const EthersResolveAddressMock = jest.spyOn(StaticJsonRpcProvider.prototype, "resolveName");

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    EthersLookupAddressMock.mockImplementation(async (address) => {
      if (address === MOCK_ADDRESS) return MOCK_ENS;
    });
    EthersResolveAddressMock.mockImplementation(async (ens) => {
      if (ens === MOCK_ENS) return MOCK_ADDRESS;
    });
    // eslint-disable-next-line @typescript-eslint/require-await
    mockSigner.getAddress = jest.fn(async () => MOCK_ADDRESS);
  });

  it("handles valid verification attempt", async () => {
    const ens = new EnsProvider();
    const verifiedPayload = await ens.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toBeCalledWith(MOCK_ADDRESS);
    expect(EthersResolveAddressMock).toBeCalledWith(MOCK_ENS);
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
