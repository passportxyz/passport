// ---- Test subject
import { HumanIDPlatform } from "../App-Bindings.js";
import { AppContext } from "../../types.js";

// Mock Human ID SDK
jest.mock("@holonym-foundation/human-id-sdk");

import * as humanIdSdk from "@holonym-foundation/human-id-sdk";

const mockedHumanIdSdk = humanIdSdk as jest.Mocked<typeof humanIdSdk>;

// Mock wagmi hooks
const mockSignMessageAsync = jest.fn();
const mockSendTransactionAsync = jest.fn();
const mockSwitchChainAsync = jest.fn();

// Mock initHumanID result
const mockHumanID = {
  getKeygenMessage: jest.fn(),
  privateRequestSBT: jest.fn(),
};

describe("HumanIDPlatform", () => {
  let platform: HumanIDPlatform;
  let mockAppContext: AppContext;

  beforeEach(() => {
    jest.clearAllMocks();
    platform = new HumanIDPlatform();

    mockAppContext = {
      state: "test-state",
      userDid: "did:test:123",
      callbackUrl: "http://localhost:3000/callback",
      selectedProviders: ["HumanIdPhone"],
      waitForRedirect: jest.fn(),
      window: {
        open: jest.fn(),
      },
      screen: {
        width: 1920,
        height: 1080,
      },
      address: "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71",
      signMessageAsync: mockSignMessageAsync,
      sendTransactionAsync: mockSendTransactionAsync,
      switchChainAsync: mockSwitchChainAsync,
    };

    mockedHumanIdSdk.initHumanID.mockReturnValue(mockHumanID);
  });

  describe("Platform Configuration", () => {
    it("should have correct platform properties", () => {
      expect(platform.platformId).toBe("HumanID");
      expect(platform.path).toBe("HumanID");
      expect(platform.isEVM).toBe(true);
    });

    it("should have banner configuration", () => {
      expect(platform.banner).toBeDefined();
      expect(platform.banner?.heading).toContain("Human ID");
      expect(platform.banner?.content).toBeDefined();
    });
  });

  describe("getProviderPayload", () => {
    it("should return humanId payload for signature request", async () => {
      const mockMessage = "Sign this message to generate your Human ID key";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      const result = await platform.getProviderPayload(mockAppContext);

      expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
      expect(mockHumanID.getKeygenMessage).toHaveBeenCalled();
      expect(result).toEqual({
        humanId: {
          action: "requestSignature",
          message: mockMessage,
          sbtType: "phone",
        },
      });
    });

    it("should handle different SBT types", async () => {
      const mockMessage = "Sign this message to generate your Human ID key";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      // Test with KYC provider
      const kycContext = {
        ...mockAppContext,
        selectedProviders: ["HumanIdKyc"],
      };

      const result = await platform.getProviderPayload(kycContext);

      expect(result.humanId?.sbtType).toBe("kyc");
    });

    it("should handle Human ID SDK initialization failure", async () => {
      mockedHumanIdSdk.initHumanID.mockImplementation(() => {
        throw new Error("SDK initialization failed");
      });

      await expect(platform.getProviderPayload(mockAppContext)).rejects.toThrow("SDK initialization failed");
    });
  });
});
