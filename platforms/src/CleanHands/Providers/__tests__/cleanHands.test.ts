import { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";
import axios from "axios";
import { ClanHandsProvider } from "../index.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockSignApiKey = "0xsign_api_key";

describe("ClanHandsProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockContext: ProviderContext = {
    github: {
      id: "123",
    },
  };
  const mockPayload: RequestPayload = {
    address: "0x0000000000000000000000000000000000000000",
    proofs: {
      code: "ABC123_ACCESSCODE",
    },
    type: "",
    version: "",
  };
  const mockIndexingValue = "0xnullifier";
  it("handles valid verification attempt", async () => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        data: {
          data: {
            rows: [
              {
                schema: { id: "onchain_evm_10_0x8" },
                attester: "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd",
                isReceiver: true,
                revoked: false,
                validUntil: new Date().getTime() / 1000 + 3600,
                indexingValue: mockIndexingValue,
              },
            ],
          },
        },
      };
    });

    const provider = new ClanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith("https://mainnet-rpc.sign.global/api/index/attestations", {
      headers: {
        "x-api-key": mockSignApiKey,
      },
      params: {
        attester: "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd",
        recipient: "0x0000000000000000000000000000000000000000",
        schemaId: "onchain_evm_10_0x8",
        size: 100,
      },
    });
    expect(result).toEqual({
      valid: true,
      errors: undefined,
      record: { id: mockIndexingValue },
    });
  });

  it.each([
    [
      {
        schema: { id: "bad_schema" },
      },
    ],
    [
      {
        attester: "bad_attester",
      },
    ],
    [{ revoked: true }],
    [{ validUntil: new Date().getTime() / 1000 - 3600 }],
    [{ indexingValue: undefined }],
    [{ indexingValue: null }],
  ])("handles invalid verification attempt with: `%s`", async (attestationAttributes) => {
    mockedAxios.get.mockImplementation(async () => {
      return {
        data: {
          data: {
            rows: [
              {
                schema: { id: "onchain_evm_10_0x8" },
                attester: "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd",
                isReceiver: true,
                revoked: false,
                validUntil: new Date().getTime() / 1000 + 3600,
                indexingValue: mockIndexingValue,
                ...attestationAttributes,
              },
            ],
          },
        },
      };
    });

    const provider = new ClanHandsProvider();
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith("https://mainnet-rpc.sign.global/api/index/attestations", {
      headers: {
        "x-api-key": mockSignApiKey,
      },
      params: {
        attester: "0xB1f50c6C34C72346b1229e5C80587D0D659556Fd",
        recipient: "0x0000000000000000000000000000000000000000",
        schemaId: "onchain_evm_10_0x8",
        size: 100,
      },
    });
    expect(result).toEqual({
      valid: false,
      errors: [`Unable to find any valid attestation for ${mockPayload.address}`],
      record: undefined,
    });
  });
});
