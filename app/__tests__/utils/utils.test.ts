import { fetchPossibleEVMStamps } from "../../signer/utils";
import { providers } from "@gitcoin/passport-platforms";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";
import { Ens, Lens } from "@gitcoin/passport-platforms";

const mockedAllPlatforms = new Map();
mockedAllPlatforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.EnsProviderConfig,
});

mockedAllPlatforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.LensProviderConfig,
});

describe("fetchPossibleEVMStamps", () => {
  it("should return valid platforms", async () => {
    jest
      .spyOn(providers._providers["Ens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return VALID_ENS_VERIFICATION.payload;
      });

    VALID_LENS_VERIFICATION.payload.valid = false;
    jest
      .spyOn(providers._providers["Lens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return VALID_LENS_VERIFICATION.payload;
      });
    const result = await fetchPossibleEVMStamps("0x123", mockedAllPlatforms);

    expect(result.length).toBe(1);

    expect(result[0].platformProps.platform.path).toBe("Ens");
  });
});
