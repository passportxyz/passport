// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { HumanIdPhoneProvider } from "../Providers/humanIdPhone.js";

// ----- Libs
import * as humanIdSdk from "@holonym-foundation/human-id-sdk";

// Mock the Human ID SDK
jest.mock("@holonym-foundation/human-id-sdk");

const mockedHumanIdSdk = humanIdSdk as jest.Mocked<typeof humanIdSdk>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";
const MOCK_NULLIFIER = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const MOCK_SBT_RESULT = [
  Date.now(), // expiry
  ["0x", MOCK_NULLIFIER], // publicValues [0, nullifier]
  false, // revoked
];

describe("HumanIdPhoneProvider", function () {
  let provider: HumanIdPhoneProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new HumanIdPhoneProvider();
  });

  describe("verify", () => {
    it("should return true when valid SBT is found", async () => {
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValueOnce(MOCK_SBT_RESULT);

      const payload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      const result = await provider.verify(payload);

      expect(mockedHumanIdSdk.setOptimismRpcUrl).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL);
      expect(mockedHumanIdSdk.getPhoneSBTByAddress).toHaveBeenCalledWith(MOCK_ADDRESS);
      expect(result).toEqual({
        valid: true,
        record: {
          nullifier: MOCK_NULLIFIER,
        },
      });
    });

    it("should return false when no SBT is found", async () => {
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValueOnce(null);

      const payload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      const result = await provider.verify(payload);

      expect(result).toEqual({
        valid: false,
        errors: ["No phone SBT found for this address"],
        record: undefined,
      });
    });

    it("should return false when SBT query returns undefined", async () => {
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValueOnce(undefined);

      const payload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      const result = await provider.verify(payload);

      expect(result).toEqual({
        valid: false,
        errors: ["No phone SBT found for this address"],
        record: undefined,
      });
    });

    it("should throw error when Human ID SDK call fails", async () => {
      const errorMessage = "RPC connection failed";
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockRejectedValueOnce(new Error(errorMessage));

      const payload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      await expect(provider.verify(payload)).rejects.toThrow(`Error verifying Human ID phone SBT: ${errorMessage}`);
    });

    it("should throw error when RPC URL is not configured", async () => {
      // Mock environment variable not being set
      const originalEnv = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;
      delete process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;

      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});

      const payload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      await expect(provider.verify(payload)).rejects.toThrow("Optimism RPC URL not configured");

      // Restore environment variable
      if (originalEnv) {
        process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL = originalEnv;
      }
    });
  });
});
