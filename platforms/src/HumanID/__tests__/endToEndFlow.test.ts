// ---- End-to-End Integration Tests for Human ID Platform
import { HumanIDPlatform } from "../App-Bindings.js";
import { HumanIdPhoneProvider } from "../Providers/humanIdPhone.js";
import { AppContext } from "../../types.js";
import { RequestPayload, PROVIDER_ID } from "@gitcoin/passport-types";
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
    request: jest.fn(),
    requestSBT: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    platform = new HumanIDPlatform();
    provider = new HumanIdPhoneProvider();

    process.env.OPTIMISM_RPC_URL = "https://mainnet.optimism.io";

    mockAppContext = {
      state: "test-state",
      userDid: "did:test:123",
      callbackUrl: "http://localhost:3000/callback",
      selectedProviders: ["HumanIdPhone" as PROVIDER_ID],
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
    delete process.env.OPTIMISM_RPC_URL;
  });

  describe("Successful Complete Flow", () => {
    it("should complete entire flow from frontend request to backend verification", async () => {
      // Setup mocks for the complete flow
      const mockMessage = "Sign this message to generate your Human ID key";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      // Mock wagmi functions
      mockSignMessageAsync.mockResolvedValue(MOCK_SIGNATURE);
      mockSendTransactionAsync.mockResolvedValue(MOCK_TX_HASH);
      mockSwitchChainAsync.mockResolvedValue(undefined);

      // Mock the SBT result that privateRequestSBT will return
      const mockSBTResult = {
        sbt: {
          recipient: MOCK_ADDRESS,
          txHash: MOCK_TX_HASH,
        },
        success: true,
      };

      // Mock privateRequestSBT to return the expected result
      mockHumanID.privateRequestSBT.mockResolvedValue(mockSBTResult);

      // Step 1: Call getProviderPayload which handles the entire flow
      const payload = await platform.getProviderPayload(mockAppContext);

      // Verify the payload structure matches the implementation
      expect(payload).toEqual({
        humanId: {
          sbtRecipient: MOCK_ADDRESS,
          transactionHash: MOCK_TX_HASH, // Now comes from the actual result
          sbtType: "phone",
        },
      });

      // Verify SDK functions were called
      expect(mockedHumanIdSdk.initHumanID).toHaveBeenCalled();
      expect(mockHumanID.getKeygenMessage).toHaveBeenCalled();
      expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: mockMessage });
      expect(mockHumanID.privateRequestSBT).toHaveBeenCalledWith("phone", {
        signature: MOCK_SIGNATURE,
        address: MOCK_ADDRESS,
        paymentCallback: expect.any(Function),
      });

      // Step 2: Backend - Verify SBT exists - should match { expiry, publicValues, revoked } format
      const mockSBTQueryResult = {
        expiry: BigInt(Date.now()),
        publicValues: [BigInt("0x0"), BigInt("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")], // [0, nullifier]
        revoked: false,
      };

      mockedHumanIdSdk.setOptimismRpcUrl.mockImplementation(() => {});
      (mockedHumanIdSdk.getPhoneSBTByAddress as jest.Mock).mockResolvedValue(mockSBTQueryResult);

      const verificationPayload: RequestPayload = {
        address: MOCK_ADDRESS,
        type: "HumanIdPhone",
        version: "0.0.0",
      };

      const verificationResult = await provider.verify(verificationPayload);

      expect(verificationResult).toEqual({
        valid: true,
        record: {
          nullifier: "8234104122482341265491137074636836252947884782870784360943022469005013929455", // BigInt converted to string
        },
      });

      // Verify backend SDK calls were made correctly
      expect(mockedHumanIdSdk.setOptimismRpcUrl).toHaveBeenCalledWith(process.env.OPTIMISM_RPC_URL);
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
      delete process.env.OPTIMISM_RPC_URL;

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
      // Clear any previous mocks to ensure clean state
      jest.clearAllMocks();

      const kycContext = {
        ...mockAppContext,
        selectedProviders: ["HumanIdKyc" as PROVIDER_ID],
      };

      // Setup fresh mocks for KYC flow
      const mockMessage = "Sign this message for KYC";
      mockHumanID.getKeygenMessage.mockReturnValue(mockMessage);

      mockSignMessageAsync.mockResolvedValue(MOCK_SIGNATURE);
      mockSendTransactionAsync.mockResolvedValue(MOCK_TX_HASH);
      mockSwitchChainAsync.mockResolvedValue(undefined);

      const mockSBTResult = {
        sbt: {
          recipient: MOCK_ADDRESS,
          txHash: MOCK_TX_HASH,
        },
        success: true,
      };

      mockHumanID.privateRequestSBT.mockResolvedValue(mockSBTResult);

      const payload = await platform.getProviderPayload(kycContext);

      expect((payload as { humanId?: { sbtType?: string } }).humanId?.sbtType).toBe("kyc");
      expect(mockHumanID.privateRequestSBT).toHaveBeenCalledWith("kyc", {
        signature: MOCK_SIGNATURE,
        address: MOCK_ADDRESS,
        paymentCallback: expect.any(Function),
      });
    });
  });
});
