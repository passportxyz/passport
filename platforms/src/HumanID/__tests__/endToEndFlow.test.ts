// ---- End-to-End Integration Tests for Human ID Platform
import { HumanIDPlatform } from "../App-Bindings.js";
import { HumanIdPhoneProvider } from "../Providers/humanIdPhone.js";
import { AppContext, RequestPayload } from "../../types.js";
import * as humanIdSdk from "@holonym-foundation/human-id-sdk";

// Mock the Human ID SDK
jest.mock("@holonym-foundation/human-id-sdk");

const mockedHumanIdSdk = humanIdSdk as jest.Mocked<typeof humanIdSdk>;

describe("Human ID End-to-End Integration", () => {
  let platform: HumanIDPlatform;
  let provider: HumanIdPhoneProvider;
  let mockAppContext: AppContext;

  const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";
  const MOCK_SIGNATURE =
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b";
  const MOCK_TX_HASH = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";

  // Mock wagmi functions
  const mockSignMessageAsync = jest.fn();
  const mockSendTransactionAsync = jest.fn();
  const mockSwitchChainAsync = jest.fn();

  const mockHumanID = {
    getKeygenMessage: jest.fn(),
    privateRequestSBT: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    platform = new HumanIDPlatform();
    provider = new HumanIdPhoneProvider();

    process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL = "https://mainnet.optimism.io";

    mockAppContext = {
      state: "test-state",
      userDid: "did:test:123",
      callbackUrl: "http://localhost:3000/callback",
      selectedProviders: ["HumanIdPhone"],
      waitForRedirect: jest.fn(),
      window: { open: jest.fn() },
      screen: { width: 1920, height: 1080 },
      address: MOCK_ADDRESS,
      signMessageAsync: mockSignMessageAsync,
      sendTransactionAsync: mockSendTransactionAsync,
      switchChainAsync: mockSwitchChainAsync,
    };

    mockedHumanIdSdk.initHumanID.mockReturnValue(mockHumanID);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;
  });

  describe("Successful Complete Flow", () => {
    it("should complete entire flow from frontend request to backend verification", async () => {
      // Step 1: Frontend - Get provider payload
      const mockMessage = "Sign this message to generate your Human ID key";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      const payload = await platform.getProviderPayload(mockAppContext);

      expect(payload).toEqual({
        humanId: {
          action: "requestSignature",
          message: mockMessage,
          sbtType: "phone",
        },
      });

      // Step 2: Frontend - User signs message
      mockSignMessageAsync.mockResolvedValue(MOCK_SIGNATURE);
      const signature = await mockSignMessageAsync({ message: mockMessage });
      expect(signature).toBe(MOCK_SIGNATURE);

      // Step 3: Frontend - SBT request with payment
      const mockTransaction = {
        to: "0x1234567890123456789012345678901234567890",
        value: "1000000000000000000",
        data: "0xabcdef123456",
        chainId: "10",
      };

      const mockSBTResult = {
        recipient: MOCK_ADDRESS,
        success: true,
        txHash: MOCK_TX_HASH,
      };

      mockSwitchChainAsync.mockResolvedValue(undefined);
      mockSendTransactionAsync.mockResolvedValue(MOCK_TX_HASH);

      mockHumanID.privateRequestSBT.mockImplementation(async (sbtType, options) => {
        const paymentResult = await options.paymentCallback(mockTransaction);
        expect(paymentResult).toEqual({
          txHash: MOCK_TX_HASH,
          chainId: 10,
        });
        return mockSBTResult;
      });

      const paymentCallback = async (tx: any) => {
        await mockSwitchChainAsync({ chainId: Number(tx.chainId) });
        const txHash = await mockSendTransactionAsync({
          to: tx.to,
          value: BigInt(tx.value ?? "0"),
          data: tx.data,
        });
        return {
          txHash,
          chainId: Number(tx.chainId),
        };
      };

      const sbtResult = await mockHumanID.privateRequestSBT("phone", {
        signature,
        address: MOCK_ADDRESS,
        paymentCallback,
      });

      expect(sbtResult).toEqual(mockSBTResult);

      // Step 4: Backend - Verify SBT exists
      const mockSBTQueryResult = {
        address: MOCK_ADDRESS,
        timestamp: Date.now(),
        tokenId: "123",
        chainId: 10,
      };

      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValue(mockSBTQueryResult);

      const verificationPayload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      const verificationResult = await provider.verify(verificationPayload);

      expect(verificationResult).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS,
        },
      });

      // Verify all SDK calls were made correctly
      expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
      expect(mockHumanID.getKeygenMessage).toHaveBeenCalled();
      expect(mockHumanID.privateRequestSBT).toHaveBeenCalledWith("phone", {
        signature: MOCK_SIGNATURE,
        address: MOCK_ADDRESS,
        paymentCallback,
      });
      expect(mockedHumanIdSdk.setOptimismRpcUrl).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL);
      expect(mockedHumanIdSdk.getPhoneSBTByAddress).toHaveBeenCalledWith(MOCK_ADDRESS);
    });
  });

  describe("Key Error Scenarios", () => {
    it("should handle SBT minting failure and verification", async () => {
      // SBT request fails
      mockHumanID.privateRequestSBT.mockRejectedValue(new Error("SBT minting failed"));

      const paymentCallback = jest.fn();

      await expect(
        mockHumanID.privateRequestSBT("phone", {
          signature: MOCK_SIGNATURE,
          address: MOCK_ADDRESS,
          paymentCallback,
        })
      ).rejects.toThrow("SBT minting failed");

      // Backend verification should fail since no SBT was minted
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockResolvedValue(null);

      const verificationResult = await provider.verify({
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      } as RequestPayload);

      expect(verificationResult.valid).toBe(false);
    });

    it("should handle backend RPC errors", async () => {
      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      mockedHumanIdSdk.getPhoneSBTByAddress.mockRejectedValue(new Error("RPC connection failed"));

      await expect(
        provider.verify({
          address: MOCK_ADDRESS,
          type: "HumanIdPhone",
          version: "0.0.0",
        } as RequestPayload)
      ).rejects.toThrow("Error verifying Human ID phone SBT: RPC connection failed");
    });
  });

  describe("Configuration", () => {
    it("should handle missing RPC configuration", async () => {
      delete process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;

      await expect(
        provider.verify({
          address: MOCK_ADDRESS,
          type: "HumanIdPhone",
          version: "0.0.0",
        } as RequestPayload)
      ).rejects.toThrow("Optimism RPC URL not configured");
    });
  });

  describe("Different SBT Types", () => {
    it("should handle KYC SBT flow", async () => {
      const kycContext = {
        ...mockAppContext,
        selectedProviders: ["HumanIdKyc"],
      };

      const mockMessage = "Sign this message for KYC";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      const payload = await platform.getProviderPayload(kycContext);

      expect(payload.humanId?.sbtType).toBe("kyc");
    });
  });
});
