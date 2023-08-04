// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import * as profileProviderModule from "../Providers/cyberconnect";
import * as nonEvmProvider from "../Providers/cyberconnect_nonevm";

const MOCK_ADDRESS_PREMIUM = "0xC47Aa859Fa329496dB6d498165da7e0B1FE13430"; // peiwen.cyber
const MOCK_ADDRESS_PAID = "0x000aB43e658935BA39504a1424b01756c1E9644c"; // gasless.cyber
const MOCK_ADDRESS_ORG = "0xC47Aa859Fa329496dB6d498165da7e0B1FE13430"; // peiwen.cyber
const MOCK_ADDRESS_NULL = "0x0000000000000000000000000000000000000000";
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";

describe("Attempt premium verification", function () {
  it("handles valid verification attempt", async () => {
    const cc = new profileProviderModule.CyberProfilePremiumProvider();
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockResolvedValueOnce(
      Promise.resolve({
        handleLength: 5,
      })
    );
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_ADDRESS_PREMIUM,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_PREMIUM.toLocaleLowerCase(),
      },
    });
  });

  it("should return false for paid handle", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockResolvedValueOnce(
      Promise.resolve({
        handleLength: 8,
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
      record: {},
    });
  });

  it("should return false for null address", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockRejectedValueOnce("bad address");
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
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockRejectedValueOnce("bad address");
    const cc = new profileProviderModule.CyberProfilePremiumProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_FAKE_ADDRESS,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["CyberProfile provider get user primary handle error"],
    });
  });
});

describe("Attempt paid verification", function () {
  it("handles valid verification attempt", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockResolvedValueOnce(
      Promise.resolve({
        handleLength: 8,
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
      record: {
        address: MOCK_ADDRESS_PAID.toLocaleLowerCase(),
      },
    });
  });

  it("should return false for premium handle", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockResolvedValueOnce(
      Promise.resolve({
        handleLength: 5,
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
      valid: false,
      record: {},
    });
  });

  it("should return false for null address", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockRejectedValueOnce("bad address");
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
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(profileProviderModule, "getLengthOfPrimaryHandle").mockRejectedValueOnce("bad address");
    const cc = new profileProviderModule.CyberProfilePaidProvider();
    const verifiedPayload = await cc.verify(
      {
        address: MOCK_FAKE_ADDRESS,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["CyberProfile provider get user primary handle error"],
    });
  });
});

describe("Attempt org membership verification", function () {
  it("handles valid verification attempt", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValue(true);
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_ORG,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_ORG.toLocaleLowerCase(),
      },
    });
  });

  it("should return false for paid handle", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValue(false);
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_PAID,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });

  it("should return false for null address", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockResolvedValue(false);
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_ADDRESS_NULL,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });

  it("should return false for invalid address", async () => {
    jest.spyOn(nonEvmProvider, "checkForOrgMember").mockRejectedValueOnce("bad address");
    const cc = new nonEvmProvider.CyberProfileOrgMemberProvider();
    const verifiedPayload = await cc.verify({
      address: MOCK_FAKE_ADDRESS,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["CyberProfile provider check organization membership error"],
    });
  });
});
