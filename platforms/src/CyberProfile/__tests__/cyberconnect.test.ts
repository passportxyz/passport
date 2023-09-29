// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import ts from "typescript";
import { ProviderExternalVerificationError } from "../../types";
import * as profileProviderModule from "../Providers/cyberconnect";
import * as nonEvmProvider from "../Providers/cyberconnect_nonevm";

jest.spyOn(profileProviderModule, "getPrimaryHandle");

const MOCK_ADDRESS_PREMIUM = "0xC47Aa859Fa329496dB6d498165da7e0B1FE13430"; // peiwen.cyber
const MOCK_ADDRESS_PAID = "0x000aB43e658935BA39504a1424b01756c1E9644c"; // gasless.cyber
const MOCK_ADDRESS_ORG = "0xC47Aa859Fa329496dB6d498165da7e0B1FE13430"; // peiwen.cyber
const MOCK_ADDRESS_ORG_ID = "link3-peiwen";
const MOCK_ADDRESS_NULL = "0x0000000000000000000000000000000000000000";
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";

describe("Attempt premium verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("handles valid verification attempt", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockResolvedValue(
      Promise.resolve({
        handle: "peiwen",
      })
    );

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
        userHandle: "peiwen",
      },
    });
  });

  it("should return false for paid handle", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockResolvedValue(
      Promise.resolve({
        handle: "12345678",
      })
    );
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
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockRejectedValueOnce("bad address");
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
      errors: ["The length of your primary handle is 0, which does not qualify for this stamp data point."],
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockRejectedValueOnce("bad address");
    const cc = new profileProviderModule.CyberProfilePremiumProvider();

    await expect(async () => {
      return await cc.verify(
        {
          address: MOCK_FAKE_ADDRESS,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(
      new ProviderExternalVerificationError("CyberProfile provider check organization membership error: {}")
    );
  });
});

describe("Attempt paid verification", function () {
  it("handles valid verification attempt", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockResolvedValue(
      Promise.resolve({
        handle: "gasless",
      })
    );
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
        userHandle: "gasless",
      },
    });
  });

  it("should return false for premium handle", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockResolvedValue(
      Promise.resolve({
        handle: "12345",
      })
    );
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PREMIUM,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      errors: ["The length of your primary handle is 6, which does not qualify for this stamp data point."],
      valid: false,
      record: {},
    });
  });

  it("should return false for null address", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockRejectedValueOnce("bad address");
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
      errors: ["The length of your primary handle is 0, which does not qualify for this stamp data point."],
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(profileProviderModule, "getPrimaryHandle").mockRejectedValueOnce("bad address");
    const cc = new profileProviderModule.CyberProfilePaidProvider();

    await expect(async () => {
      return await cc.verify(
        {
          address: MOCK_FAKE_ADDRESS,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(
      new ProviderExternalVerificationError("CyberProfile provider check organization membership error: {}")
    );
  });
});

describe("Attempt org membership verification", function () {
  it("handles valid verification attempt", async () => {
    jest
      .spyOn(nonEvmProvider, "checkForOrgMember")
      .mockResolvedValue({ isMember: true, identifier: MOCK_ADDRESS_ORG_ID });
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_ORG,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        orgMembership: MOCK_ADDRESS_ORG_ID,
      },
    });
  });

  it("should return false for paid handle", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValue({ isMember: false, identifier: "bad" });
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
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValue({ isMember: false, identifier: "bad" });
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
