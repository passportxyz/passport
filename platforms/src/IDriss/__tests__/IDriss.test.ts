// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { IDrissProvider } from "../Providers/IDrissProvider";

const MOCK_ADDRESS_MEMBER = "0x4a3755eB99ae8b22AaFB8f16F0C51CF68Eb60b85";
const MOCK_ADDRESS_MEMBER_LOWER = MOCK_ADDRESS_MEMBER.toLocaleLowerCase();
const MOCK_ADDRESS_NO_MEMBER = "0x5ABca791C22E7f99237fCC04639E094Ffa0cCce9";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Return true for an address holding the membership nft", async () => {
    const idr = new IDrissProvider();
    const verifiedPayload = await idr.verify({
      address: MOCK_ADDRESS_MEMBER,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_MEMBER_LOWER,
      },
    });
  });

  it("Return false for an address not holding the membership nft", async () => {

    const idr = new IDrissProvider();
    const verifiedPayload = await idr.verify({
      address: MOCK_ADDRESS_NO_MEMBER,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });

  it("should return error response when getNFTBalnce call errors", async () => {

    const idr = new IDrissProvider();
    const verifiedPayload = await idr.verify({
      address: "0xnoaddress",
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["NFT Possession Provider Error"],
    });
  });
});
