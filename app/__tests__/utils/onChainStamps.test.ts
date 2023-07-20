import { decodeProviderInformation } from "../../utils/onChainStamps";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import axios from "axios";
import { Attestation } from "@ethereum-attestation-service/eas-sdk";
import { BigNumber } from "@ethersproject/bignumber";
import * as easModule from "@ethereum-attestation-service/eas-sdk";

jest.mock("axios");
jest.mock("@ethereum-attestation-service/eas-sdk", () => ({
  SchemaEncoder: jest.fn(),
  Attestation: jest.fn(),
}));

describe("decodeProviderInformation", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("decodes and sorts provider information with multiple provider maps", async () => {
    (SchemaEncoder as unknown as jest.Mock).mockImplementation(() => ({
      decodeData: jest.fn().mockReturnValue([
        { name: "providers", value: { value: [BigNumber.from(1), BigNumber.from(2)] } },
        { name: "issuanceDates", value: { value: ["issuanceDate1", "issuanceDate2"] } },
        { name: "expirationDates", value: { value: ["expirationDate1", "expirationDate2"] } },
        { name: "hashes", value: { value: ["hash1", "hash2"] } },
      ]),
    }));
    process.env.NEXT_PUBLIC_PASSPORT_IAM_STATIC_URL = "mockStaticUrl";

    const mockStampBits = [
      { bit: 0, index: 0, name: "provider1" },
      { bit: 1, index: 1, name: "provider2" },
    ];
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockStampBits });

    const mockAttestation = {
      data: "0x00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000001800b80000000000000000000000000000000000000000000000000000000000000000000000641d8c507c13a15bbc14fc1cffb89abed50636a5f820bb68370002a1802ac5e8bd45a7e1d5d1e1db74cd8d22cfc27b06c5ed0b3a71a59fc0783b04946da80a92cf20329ef6a8bee088b1ed88ebff024b8b8966afdb5890e6c53a1a3337f33a70c62cdf165cd19977253c6edc0106643bcf646c0e4a1697e6a2938143f89342f1373060a40e406af7eb0058b6c76d09614bf12b0b01fac51b3c74e5c7bc04882295b719ae944972596f85251db9e3f81888973c834cc348c43e42e5ceda3a6906100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000064b062680000000000000000000000000000000000000000000000000000000064b062680000000000000000000000000000000000000000000000000000000064b0626b0000000000000000000000000000000000000000000000000000000064b0626b0000000000000000000000000000000000000000000000000000000064a5fafc0000000000000000000000000000000000000000000000000000000064a5fafd000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000652709680000000000000000000000000000000000000000000000000000000065270968000000000000000000000000000000000000000000000000000000006527096b000000000000000000000000000000000000000000000000000000006527096b00000000000000000000000000000000000000000000000000000000651ca1fc00000000000000000000000000000000000000000000000000000000651ca1fd",
    } as Attestation;

    const result = await decodeProviderInformation(mockAttestation);

    expect(axios.get).toHaveBeenCalledWith("mockStaticUrl/providerBitMapInfo.json");
    expect(SchemaEncoder).toHaveBeenCalledWith(
      "uint256[] providers,bytes32[] hashes,uint64[] issuanceDates,uint64[] expirationDates,uint16 providerMapVersion"
    );
    expect(result).toEqual({
      onChainProviderInfo: [
        { providerName: "provider1", providerNumber: 0 },
        { providerName: "provider2", providerNumber: 257 },
      ],
      hashes: ["hash1", "hash2"],
      issuanceDates: ["issuanceDate1", "issuanceDate2"],
      expirationDates: ["expirationDate1", "expirationDate2"],
    });
  });

  it("decodes and sorts provider information with a single providermap", async () => {
    const providerMap = BigNumber.from(11);
    (SchemaEncoder as unknown as jest.Mock).mockImplementation(() => ({
      decodeData: jest.fn().mockReturnValue([
        { name: "providers", value: { value: [providerMap] } },
        { name: "issuanceDates", value: { value: ["issuanceDate1", "issuanceDate2", "issuanceDate4"] } },
        { name: "expirationDates", value: { value: ["expirationDate1", "expirationDate2", "expirationDate4"] } },
        { name: "hashes", value: { value: ["hash1", "hash2", "hash3"] } },
      ]),
    }));
    process.env.NEXT_PUBLIC_PASSPORT_IAM_STATIC_URL = "mockStaticUrl";

    const mockStampBits = [
      { bit: 0, index: 0, name: "provider1" },
      { bit: 1, index: 0, name: "provider2" },
      { bit: 2, index: 0, name: "provider3" },
      { bit: 3, index: 0, name: "provider4" },
    ];
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockStampBits });

    const mockAttestation = {
      data: "0x00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000001800b80000000000000000000000000000000000000000000000000000000000000000000000641d8c507c13a15bbc14fc1cffb89abed50636a5f820bb68370002a1802ac5e8bd45a7e1d5d1e1db74cd8d22cfc27b06c5ed0b3a71a59fc0783b04946da80a92cf20329ef6a8bee088b1ed88ebff024b8b8966afdb5890e6c53a1a3337f33a70c62cdf165cd19977253c6edc0106643bcf646c0e4a1697e6a2938143f89342f1373060a40e406af7eb0058b6c76d09614bf12b0b01fac51b3c74e5c7bc04882295b719ae944972596f85251db9e3f81888973c834cc348c43e42e5ceda3a6906100000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000064b062680000000000000000000000000000000000000000000000000000000064b062680000000000000000000000000000000000000000000000000000000064b0626b0000000000000000000000000000000000000000000000000000000064b0626b0000000000000000000000000000000000000000000000000000000064a5fafc0000000000000000000000000000000000000000000000000000000064a5fafd000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000652709680000000000000000000000000000000000000000000000000000000065270968000000000000000000000000000000000000000000000000000000006527096b000000000000000000000000000000000000000000000000000000006527096b00000000000000000000000000000000000000000000000000000000651ca1fc00000000000000000000000000000000000000000000000000000000651ca1fd",
    } as Attestation;

    const result = await decodeProviderInformation(mockAttestation);

    expect(axios.get).toHaveBeenCalledWith("mockStaticUrl/providerBitMapInfo.json");
    expect(SchemaEncoder).toHaveBeenCalledWith(
      "uint256[] providers,bytes32[] hashes,uint64[] issuanceDates,uint64[] expirationDates,uint16 providerMapVersion"
    );
    expect(result).toEqual({
      onChainProviderInfo: [
        { providerName: "provider1", providerNumber: 0 },
        { providerName: "provider2", providerNumber: 1 },
        { providerName: "provider4", providerNumber: 3 },
      ],
      hashes: ["hash1", "hash2", "hash3"],
      issuanceDates: ["issuanceDate1", "issuanceDate2", "issuanceDate4"],
      expirationDates: ["expirationDate1", "expirationDate2", "expirationDate4"],
    });
  });
});
