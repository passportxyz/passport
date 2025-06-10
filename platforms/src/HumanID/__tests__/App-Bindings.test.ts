// ---- Test subject
import { HumanIDPlatform } from "../App-Bindings.js";
import { AppContext } from "../../types.js";

// Mock Human ID SDK
jest.mock("@holonym-foundation/human-id-sdk");

import * as humanIdSdk from "@holonym-foundation/human-id-sdk";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// Mock environment variable
const originalEnv = process.env;

const mockedHumanIdSdk = humanIdSdk as jest.Mocked<typeof humanIdSdk>;

// Mock wagmi hooks
const mockSignMessageAsync = jest.fn();
const mockSendTransactionAsync = jest.fn();
const mockSwitchChainAsync = jest.fn();

// Mock initHumanID result
const mockHumanID = {
  getKeygenMessage: jest.fn(),
  privateRequestSBT: jest.fn(),
  request: jest.fn(),
  requestSBT: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

describe("HumanIDPlatform", () => {
  let platform: HumanIDPlatform;
  let mockAppContext: AppContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
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
      signMessageAsync: mockSignMessageAsync as ({ message }: { message: string }) => Promise<string>,
      sendTransactionAsync: mockSendTransactionAsync,
      switchChainAsync: mockSwitchChainAsync,
    };

    mockedHumanIdSdk.initHumanID.mockReturnValue(mockHumanID);
  });

  afterEach(() => {
    process.env = originalEnv;
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
    it("should complete full Human ID verification flow", async () => {
      const mockMessage = "Sign this message to generate your Human ID key";
      const mockSignature = "0xmocksignature";
      const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
      mockSignMessageAsync.mockResolvedValue(mockSignature);
      mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

      const result = await platform.getProviderPayload(mockAppContext);

      expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
      expect(mockHumanID.getKeygenMessage).toHaveBeenCalled();
      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: mockMessage });
      expect(mockHumanID.privateRequestSBT).toHaveBeenCalledWith(
        "phone",
        expect.objectContaining({
          signature: mockSignature,
          address: mockAppContext.address,
        })
      );
      expect(result).toEqual({
        humanId: {
          sbtRecipient: mockResult.sbt.recipient,
          transactionHash: mockResult.sbt.txHash,
          sbtType: "phone",
        },
      });
    });

    it("should handle different SBT types", async () => {
      const mockMessage = "Sign this message to generate your Human ID key";
      const mockSignature = "0xmocksignature";
      const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
      mockSignMessageAsync.mockResolvedValue(mockSignature);
      mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

      const kycContext = {
        ...mockAppContext,
        selectedProviders: ["HumanIdKyc" as PROVIDER_ID],
      };

      const result = await platform.getProviderPayload(kycContext);

      expect(mockHumanID.privateRequestSBT).toHaveBeenCalledWith("kyc", expect.any(Object));
      expect((result as { humanId?: { sbtType?: string } }).humanId?.sbtType).toBe("kyc");
    });

    it("should throw error when wallet methods are missing", async () => {
      const contextWithoutWallet: AppContext = {
        ...mockAppContext,
        signMessageAsync: undefined,
      };

      await expect(platform.getProviderPayload(contextWithoutWallet)).rejects.toThrow(
        "Human ID verification requires wallet connection and signing capabilities"
      );
    });

    it("should handle Human ID SDK initialization failure", async () => {
      mockedHumanIdSdk.initHumanID.mockImplementation(() => {
        throw new Error("SDK initialization failed");
      });

      await expect(platform.getProviderPayload(mockAppContext)).rejects.toThrow("SDK initialization failed");
    });

    describe("checkExistingSBT", () => {
      it("should skip verification flow if valid phone SBT already exists", async () => {
        // Set up environment with RPC URL
        process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL = "https://optimism-mainnet.infura.io/v3/test";

        // Mock successful SBT query
        const mockSBT = {
          expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // Expires in 1 hour
          publicValues: [
            BigInt(0),
            BigInt("8234104122482341265491137074636836252947884782870784360943022469005013929455"),
          ],
          revoked: false,
        };

        mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
        mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValue(mockSBT);

        const result = await platform.getProviderPayload(mockAppContext);

        // Should check for existing SBT
        expect(mockedHumanIdSdk.setOptimismRpcUrl).toHaveBeenCalledWith("https://optimism-mainnet.infura.io/v3/test");
        expect(mockedHumanIdSdk.getPhoneSBTByAddress).toHaveBeenCalledWith(mockAppContext.address);

        // Should NOT initialize SDK or go through signing flow
        expect(mockedHumanIdSdk.initHumanID).not.toHaveBeenCalled();
        expect(mockSignMessageAsync).not.toHaveBeenCalled();
        expect(mockHumanID.privateRequestSBT).not.toHaveBeenCalled();

        // Should short circuit, return empty result so we can move on to backend check
        expect(result).toEqual({});
      });

      it("should proceed with normal flow if SBT is expired", async () => {
        process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL = "https://optimism-mainnet.infura.io/v3/test";

        // Mock expired SBT
        const mockExpiredSBT = {
          expiry: BigInt(Math.floor(Date.now() / 1000) - 3600), // Expired 1 hour ago
          publicValues: [BigInt(0), BigInt("123456789")],
          revoked: false,
        };

        mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
        mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValue(mockExpiredSBT);

        const mockMessage = "Sign this message to generate your Human ID key";
        const mockSignature = "0xmocksignature";
        const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

        mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
        mockSignMessageAsync.mockResolvedValue(mockSignature);
        mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

        await platform.getProviderPayload(mockAppContext);

        // Should proceed with normal flow
        expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalled();
      });

      it("should proceed with normal flow if SBT is revoked", async () => {
        process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL = "https://optimism-mainnet.infura.io/v3/test";

        // Mock revoked SBT
        const mockRevokedSBT = {
          expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
          publicValues: [BigInt(0), BigInt("123456789")],
          revoked: true,
        };

        mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
        mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValue(mockRevokedSBT);

        const mockMessage = "Sign this message to generate your Human ID key";
        const mockSignature = "0xmocksignature";
        const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

        mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
        mockSignMessageAsync.mockResolvedValue(mockSignature);
        mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

        await platform.getProviderPayload(mockAppContext);

        // Should proceed with normal flow
        expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalled();
      });

      it("should proceed with normal flow if RPC URL is not configured", async () => {
        // No RPC URL set
        delete process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL;

        const mockMessage = "Sign this message to generate your Human ID key";
        const mockSignature = "0xmocksignature";
        const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

        mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
        mockSignMessageAsync.mockResolvedValue(mockSignature);
        mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

        await platform.getProviderPayload(mockAppContext);

        // Should NOT attempt to check SBT
        expect(mockedHumanIdSdk.getPhoneSBTByAddress).not.toHaveBeenCalled();

        // Should proceed with normal flow
        expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalled();
      });

      it("should proceed with normal flow if SBT check throws error", async () => {
        process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL = "https://optimism-mainnet.infura.io/v3/test";

        // Mock error in SBT check
        mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
        mockedHumanIdSdk.getPhoneSBTByAddress.mockRejectedValue(new Error("Network error"));

        const mockMessage = "Sign this message to generate your Human ID key";
        const mockSignature = "0xmocksignature";
        const mockResult = { sbt: { recipient: "0xrecipient123", txHash: "0xmocktxhash" } };

        mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);
        mockSignMessageAsync.mockResolvedValue(mockSignature);
        mockHumanID.privateRequestSBT.mockResolvedValue(mockResult);

        await platform.getProviderPayload(mockAppContext);

        // Should proceed with normal flow after error
        expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalled();
      });
    });
  });
});
