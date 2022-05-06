// ---- Test subject
import { RequestPayload } from "@dpopp/types";
import { EnsProvider } from "../src/providers/ens";

// ----- Ethers library
import { providers } from "ethers";

jest.mock("ethers", () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual("ethers");

  return {
    __esModule: true,
    ...originalModule,
    provider: {
      lookupAddress: (address: string) => {
        return address;
      },
      resolveName: (address: string) => {
        return address;
      },
    },
  };
});

const MOCK_ADDRESS = "0xcF300CE817E25b4F784bC1e24c9A99A525fEC50f";
const MOCK_ENS = "dpopp.eth";

const EthersLookupAddressMock = jest.spyOn(providers.StaticJsonRpcProvider.prototype, "lookupAddress");

const EthersResolveAddressMock = jest.spyOn(providers.StaticJsonRpcProvider.prototype, "resolveName");

describe("Attempt verification", function () {
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
