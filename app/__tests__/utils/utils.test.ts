import { fetchPossibleEVMStamps } from "../../signer/utils";
import { providers } from "@gitcoin/passport-platforms";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

const validLensVerification = {
  providerType: "Lens",
  payload: {
    valid: true,
    record: {
      address: "0x123",
      numberOfHandles: "1",
    },
  },
};

const validEnsVerification = {
  providerType: "Ens",
  payload: {
    valid: true,
    record: {
      ens: "MEME",
    },
  },
};

describe("fetchPossibleEVMStamps", () => {
  it("should return an array of verification responses", async () => {
    jest
      .spyOn(providers._providers["Ens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return validEnsVerification.payload;
      });

    jest
      .spyOn(providers._providers["Lens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return validLensVerification.payload;
      });
    const result = await fetchPossibleEVMStamps("0x123", ["Ens", "Lens"]);

    expect(result).toEqual([validEnsVerification, validLensVerification]);
  });

  it("should return an array of verification responses if one of the providers is invalid", async () => {
    jest
      .spyOn(providers._providers["Ens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return validEnsVerification.payload;
      });

    validLensVerification.payload.valid = false;
    jest
      .spyOn(providers._providers["Lens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return validLensVerification.payload;
      });
    const result = await fetchPossibleEVMStamps("0x123", ["Ens", "Lens"]);

    expect(result).toEqual([validEnsVerification, validLensVerification]);
  });
});
