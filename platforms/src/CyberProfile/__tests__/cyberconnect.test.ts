// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import * as profileProviderModule from "../Providers/cyberconnect";
import * as nonEvmProvider from "../Providers/cyberconnect_nonevm";
import * as ethers from "ethers";
import axios from "axios";

const MOCK_ADDRESS_PREMIUM = "0xc47aa859fa329496db6d498165da7e0b1fe13430";
const MOCK_PROFILE_PREMIUM = 1;
const MOCK_ADDRESS_PAID = "0x000ab43e658935ba39504a1424b01756c1e9644c";
const MOCK_PROFILE_PAID = 2;
const MOCK_ADDRESS_UNPAID = "0xc47aa859fa329496db6d498165da7e0b1fe13431";
const MOCK_PROFILE_UNPAID = 3;
const MOCK_ADDRESS_PREMIUM_ORG_ID = "link3-org";
const MOCK_ADDRESS_NULL = "0x0000000000000000000000000000000000000000";
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";

const mockedEthers = ethers as jest.Mocked<typeof ethers>;

jest.mock("axios");

(mockedEthers.Contract.prototype.getPrimaryProfile as jest.Mock) = jest.fn().mockImplementation((address: string) => {
  if (!address.startsWith("0x")) throw new Error("Invalid address");
  return Promise.resolve(
    ethers.BigNumber.from(
      {
        [MOCK_ADDRESS_PREMIUM]: MOCK_PROFILE_PREMIUM,
        [MOCK_ADDRESS_PAID]: MOCK_PROFILE_PAID,
        [MOCK_ADDRESS_UNPAID]: MOCK_PROFILE_UNPAID,
      }[address] || 0
    )
  );
});

(mockedEthers.Contract.prototype.getHandleByProfileId as jest.Mock) = jest
  .fn()
  .mockImplementation((profileId: number) => {
    return Promise.resolve(
      {
        [MOCK_PROFILE_PREMIUM]: "123",
        [MOCK_PROFILE_PAID]: "1234567",
        [MOCK_PROFILE_UNPAID]: "1234567890123",
      }[profileId] || ""
    );
  });

describe("Attempt premium verification", function () {
  it("works with the new cyberprofile system", async () => {
    axios.post = jest.fn().mockResolvedValueOnce({
      data: {
        data: {
          checkShortestCyberID: "123",
        },
      },
    });

    const cc = new profileProviderModule.CyberProfilePremiumProvider();

    const verifiedPayload = await cc.verify(
      {
        address: "0x0",
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        userHandle: "123",
      },
    });

    expect(mockedEthers.Contract.prototype.getPrimaryProfile).not.toHaveBeenCalled();
  });

  it("handles valid verification attempt", async () => {
    const cc = new profileProviderModule.CyberProfilePremiumProvider();

    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PREMIUM,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        userHandle: "123",
      },
    });

    expect(mockedEthers.Contract.prototype.getPrimaryProfile).toHaveBeenCalled();
  });

  it("should return false for paid handle", async () => {
    const cc = new profileProviderModule.CyberProfilePremiumProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PAID,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["The length of your primary handle is 7, which does not qualify for this stamp data point."],
      record: {},
    });
  });

  it("should return false for null address", async () => {
    const cc = new profileProviderModule.CyberProfilePremiumProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_NULL,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
      errors: ["No primary profile handle found"],
    });
  });

  it("should return false for invalid address", async () => {
    const cc = new profileProviderModule.CyberProfilePremiumProvider();

    await expect(async () => {
      return await cc.verify(
        {
          address: MOCK_FAKE_ADDRESS,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(
      new ProviderExternalVerificationError("Error getting primary handle from CyberProfile: Error: Invalid address")
    );
  });
});

describe("Attempt paid verification", function () {
  it("handles valid verification attempt", async () => {
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PAID,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        userHandle: "1234567",
      },
    });
  });

  it("should return false for paid handle when address is 13 or more", async () => {
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_UNPAID,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
      errors: ["The length of your primary handle is 13, which does not qualify for this stamp data point."],
    });
  });

  it("should return true for paid handle when address is 6 or less (premium)", async () => {
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PREMIUM,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      errors: [],
      valid: true,
      record: {
        userHandle: "123",
      },
    });
  });

  it("should return false for null address", async () => {
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_NULL,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
      errors: ["No primary profile handle found"],
    });
  });

  it("should return false for invalid address", async () => {
    const cc = new profileProviderModule.CyberProfilePaidProvider();

    await expect(async () => {
      return await cc.verify(
        {
          address: MOCK_FAKE_ADDRESS,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(
      new ProviderExternalVerificationError("Error getting primary handle from CyberProfile: Error: Invalid address")
    );
  });
});

describe("Attempt org membership verification", function () {
  it("handles valid verification attempt", async () => {
    jest
      .spyOn(nonEvmProvider, "checkForOrgMember")
      .mockResolvedValue({ isMember: true, identifier: MOCK_ADDRESS_PREMIUM_ORG_ID });
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_PREMIUM,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        orgMembership: MOCK_ADDRESS_PREMIUM_ORG_ID,
      },
    });
  });

  it("should return false for paid handle", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValueOnce({ isMember: false, identifier: "bad" });
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_PAID,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
      errors: ["We determined that you are not a member of CyberConnect, which disqualifies you for this stamp."],
    });
  });

  it("should return false for null address", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValueOnce({ isMember: false, identifier: "bad" });
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_NULL,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
      errors: ["We determined that you are not a member of CyberConnect, which disqualifies you for this stamp."],
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockRejectedValueOnce("bad address");
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    await expect(async () => {
      return await cc.verify({
        address: MOCK_FAKE_ADDRESS,
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      // eslint-disable-next-line quotes
      new ProviderExternalVerificationError('CyberProfile provider check organization membership error: "bad address"')
    );
  });
});
