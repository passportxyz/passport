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
      data: "0x0000000",
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
      data: "0x0000000",
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
