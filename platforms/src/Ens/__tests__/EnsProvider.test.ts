// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { EnsProvider } from "../Providers/EnsProvider";

// ----- Ethers library
import { ProviderExternalVerificationError } from "../../types";
import { EnsResolver, JsonRpcProvider, getAddress } from "ethers";

jest.mock("ethers");

const MOCK_ADDRESS = "0x6Cc41e662668C733c029d3c70E9CF248359ce544";
const MOCK_ENS = "dpopptest.eth";

const EthersLookupAddressMock = jest.spyOn(JsonRpcProvider.prototype, "lookupAddress");
const EthersGetResolverMock = jest.spyOn(JsonRpcProvider.prototype, "getResolver");

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    EthersLookupAddressMock.mockImplementation((address) => {
      if (address === MOCK_ADDRESS) return Promise.resolve(MOCK_ENS);
    });
    EthersGetResolverMock.mockImplementation(() => {
      return Promise.resolve({
        address: "0x231b0ee14048e9dccd1d247744d114a4eb5E8e63",
      } as EnsResolver);
    });
    (getAddress as jest.Mock).mockReturnValue(MOCK_ADDRESS);
  });

  it("handles valid verification attempt", async () => {
    const ens = new EnsProvider();
    const verifiedPayload = await ens.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toHaveBeenCalledWith(MOCK_ADDRESS);
    expect(EthersGetResolverMock).toHaveBeenCalledWith(MOCK_ENS);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        ens: MOCK_ENS,
      },
      errors: [],
    });
  });

  it("should return false for alternate resolvers", async () => {
    EthersGetResolverMock.mockImplementation(async (_) => {
      return Promise.resolve({
        address: "0x123",
      } as EnsResolver);
    });

    const ens = new EnsProvider();

    const verifiedPayload = await ens.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toHaveBeenCalledWith(MOCK_ADDRESS);

    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["Apologies! Your primary ENS name uses an alternative resolver and is not eligible for the ENS stamp."],
    });
  });

  it("should return true for old public resolver", async () => {
    EthersGetResolverMock.mockImplementation(async (_) => {
      return Promise.resolve({
        address: "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41",
      } as EnsResolver);
    });

    const ens = new EnsProvider();

    const verifiedPayload = await ens.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toHaveBeenCalledWith(MOCK_ADDRESS);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        ens: MOCK_ENS,
      },
      errors: [],
    });
  });

  it("should return false for invalid address", async () => {
    EthersLookupAddressMock.mockRejectedValueOnce("Invalid Address");
    const ens = new EnsProvider();
    const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";

    await expect(async () => {
      return await ens.verify({
        address: MOCK_FAKE_ADDRESS,
      } as unknown as RequestPayload);
    }).rejects.toThrow(new ProviderExternalVerificationError("Error verifying ENS name: Invalid Address"));
    expect(EthersLookupAddressMock).toHaveBeenCalledWith(MOCK_FAKE_ADDRESS);
  });

  it("should return false for an address without a valid ens name", async () => {
    const ens = new EnsProvider();
    const MOCK_FAKE_ADDRESS = "0xd9FA0c2bF77750EE0C154875d1b6f06aa494668a";

    const verifiedPayload = await ens.verify({
      address: MOCK_FAKE_ADDRESS,
    } as unknown as RequestPayload);

    expect(EthersLookupAddressMock).toHaveBeenCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["Primary ENS name was not found for given address."],
      record: undefined,
    });
  });
});
