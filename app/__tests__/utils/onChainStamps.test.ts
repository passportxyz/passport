import { parsePassportData } from "../../utils/onChainStamps";

jest.mock("axios");
jest.mock("@ethereum-attestation-service/eas-sdk", () => ({
  SchemaEncoder: jest.fn(),
  Attestation: jest.fn(),
}));

// Prevents issue with module import in jest
jest.mock("../../utils/onboard", () => ({
  chains: [{ id: "0x14a33", rpcUrl: "mockRpcUrl" }],
}));

describe("parsePassportData", () => {
  it("should return an array of OnChainProviderTypes", () => {
    const passports = [
      ["Provider1", "0x616263", "1622470087", "1622556487"],
      ["Provider2", "0x646566", "1622470187", "1622556587"],
    ];

    const result = parsePassportData(passports);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(passports.length);
  });

  it("should correctly parse provider names", () => {
    const passports = [["Provider1", "0x616263", "1622470087", "1622556487"]];

    const result = parsePassportData(passports);

    expect(result[0].providerName).toBe("Provider1");
  });

  it("should correctly convert credentialHash to base64", () => {
    const passports = [["Provider1", "0x616263", "1622470087", "1622556487"]];

    const result = parsePassportData(passports);

    const expectedCredentialHash = Buffer.from("616263", "hex").toString("base64");
    expect(result[0].credentialHash).toBe(`v0.0.0:${expectedCredentialHash}`);
  });

  it("should correctly convert dates to milliseconds", () => {
    const passports = [["Provider1", "0x616263", "1622470087", "1622556487"]];

    const result = parsePassportData(passports);

    expect(result[0].issuanceDate).toBe(1622470087 * 1000);
    expect(result[0].expirationDate).toBe(1622556487 * 1000);
  });

  it("should handle an empty array", () => {
    const result = parsePassportData([]);

    expect(result).toEqual([]);
  });
});
