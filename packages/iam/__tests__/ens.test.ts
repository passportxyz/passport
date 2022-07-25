// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { EnsProvider } from "../src/providers/ens";

// ----- Ethers library
import { StaticJsonRpcProvider } from "@ethersproject/providers";

jest.mock("@ethersproject/providers");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ENS = "dpopptest.eth";

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
