import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { GenericPlatform } from "../../components/GenericPlatform";

// Mock Human ID SDK
import {
  mockInitHumanID,
  mockGetKeygenMessage,
  mockPrivateRequestSBT,
  mockRequestSBT,
  resetHumanIDMocks,
} from "../../__mocks__/@holonym-foundation/human-id-sdk";

import { CeramicContextState } from "../../context/ceramicContext";
import { fetchVerifiableCredential } from "../../utils/credentials";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { ChakraProvider } from "@chakra-ui/react";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { PlatformScoreSpec } from "../../context/scorerContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// Mock wagmi hooks with detailed control
const mockSignMessageAsync = vi.fn();
const mockSendTransactionAsync = vi.fn();
const mockSwitchChainAsync = vi.fn();

vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal()),
  useSignMessage: () => ({
    signMessageAsync: mockSignMessageAsync,
    isLoading: false,
    error: null,
  }),
  useSendTransaction: () => ({
    sendTransactionAsync: mockSendTransactionAsync,
    isLoading: false,
    error: null,
  }),
  useSwitchChain: () => ({
    switchChainAsync: mockSwitchChainAsync,
    isLoading: false,
    error: null,
  }),
  useAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
    chain: { id: 1 }, // Start on Ethereum mainnet
  }),
}));

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
}));

vi.mock("../../utils/credentials", () => ({
  fetchVerifiableCredential: vi.fn(),
}));

vi.mock("../../utils/helpers.tsx", async (importActual) => ({
  ...(await importActual()),
  createSignedPayload: vi.fn(),
  generateUID: vi.fn(),
  getProviderSpec: vi.fn(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

// Mock platform that thoroughly tests Human ID SDK integration
class MockDetailedHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";
  isEVM = true;

  async getProviderPayload(appContext: any) {
    const humanID = mockInitHumanID();

    // Step 1: Get keygen message
    const message = humanID.getKeygenMessage();

    // Step 2: Request user signature
    const signature = await mockSignMessageAsync({ message });

    // Step 3: Call private request SBT with full flow
    const result = await humanID.privateRequestSBT("phone", {
      signature,
      address: appContext.address,
      paymentCallback: async (tx: any) => {
        // Switch to Optimism if needed
        if (Number(tx.chainId) !== appContext.currentChainId) {
          await mockSwitchChainAsync({ chainId: Number(tx.chainId) });
        }

        // Send the payment transaction
        const txHash = await mockSendTransactionAsync({
          to: tx.to,
          value: BigInt(tx.value ?? "0"),
          data: tx.data,
        });

        return {
          txHash,
          chainId: Number(tx.chainId),
        };
      },
    });

    return {
      address: appContext.address,
      humanId: {
        keygenMessage: message,
        signature,
        sbtRecipient: result?.recipient,
        sbtType: "phone",
        completed: true,
      },
    };
  }
}

// Mock platform for simple SBT request (no wallet interaction)
class MockSimpleHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";
  isEVM = true;

  async getProviderPayload(appContext: any) {
    const humanID = mockInitHumanID();

    // Use simple request SBT (user handles wallet in iframe)
    const result = await humanID.requestSBT("phone");

    return {
      address: appContext.address,
      humanId: {
        sbtRecipient: result?.recipient,
        sbtType: "phone",
        method: "simple",
      },
    };
  }
}

const mockHumanIDProviderConfig = [
  {
    title: "Phone Verification",
    description: "Verify your phone number to receive a privacy-preserving SBT",
    providers: [
      {
        title: "Phone SBT",
        description: "Proves you have verified your phone number",
        name: "HumanIdPhone" as PROVIDER_ID,
      },
    ],
  },
];

const mockHumanIDScoreSpec: PlatformScoreSpec = {
  platform: "HumanID",
  name: "Human ID",
  icon: "./assets/humanIdStampIcon.svg",
  description: "Verify your phone number privately with Human ID",
  connectMessage: "Connect your wallet to verify with Human ID",
  possiblePoints: 5,
  earnedPoints: 0,
};

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("Human ID SDK Signature and Transaction Flows", () => {
  beforeEach(async () => {
    await closeAllToasts();
    resetHumanIDMocks();
    vi.clearAllMocks();

    // Setup default successful mock responses
    mockSignMessageAsync.mockResolvedValue(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234"
    );
    mockSendTransactionAsync.mockResolvedValue("0xabcdef1234567890abcdef1234567890abcdef12");
    mockSwitchChainAsync.mockResolvedValue({});

    mockGetKeygenMessage.mockReturnValue(
      "Sign this message to generate your HumanID verification key: timestamp:1234567890"
    );
    mockPrivateRequestSBT.mockResolvedValue({
      recipient: "0x9876543210987654321098765432109876543210",
    });
    mockRequestSBT.mockResolvedValue({
      recipient: "0x9876543210987654321098765432109876543210",
    });

    vi.mocked(fetchVerifiableCredential).mockResolvedValue({
      credentials: [
        {
          provider: "HumanIdPhone",
          credential: { credentialSubject: { hash: "verified" } },
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Signature Flow", () => {
    it("should generate and sign keygen message correctly", async () => {
      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockDetailedHumanIDPlatform()}
            platFormGroupSpec={mockHumanIDProviderConfig}
            platformScoreSpec={mockHumanIDScoreSpec}
            onClose={() => {}}
          />
        </ChakraProvider>
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockGetKeygenMessage).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalledWith({
          message: "Sign this message to generate your HumanID verification key: timestamp:1234567890",
        });
      });
    });

    it("should pass signature to privateRequestSBT", async () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockPrivateRequestSBT).toHaveBeenCalledWith(
          "phone",
          expect.objectContaining({
            signature:
              "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
            address: "0x1234567890123456789012345678901234567890",
            paymentCallback: expect.any(Function),
          })
        );
      });
    });

    it("should handle signature with different message formats", async () => {
      const customMessage = "Custom keygen message with special chars: !@#$%^&*()";
      mockGetKeygenMessage.mockReturnValue(customMessage);

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockSignMessageAsync).toHaveBeenCalledWith({
          message: customMessage,
        });
      });
    });
  });

  describe("Transaction Flow", () => {
    it("should handle chain switching before transaction", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0x9876543210987654321098765432109876543210" };
      });

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(capturedPaymentCallback).toBeDefined();
      });

      // Simulate transaction requiring chain switch to Optimism
      const mockTx = {
        chainId: "10", // Optimism
        to: "0xSBTContractAddress",
        value: "50000000000000000", // 0.05 ETH
        data: "0x40c10f19000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000001",
      };

      const result = await capturedPaymentCallback(mockTx);

      expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 10 });
      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: "0xSBTContractAddress",
        value: BigInt("50000000000000000"),
        data: "0x40c10f19000000000000000000000000123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000001",
      });
      expect(result).toEqual({
        txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
        chainId: 10,
      });
    });

    it("should skip chain switching if already on correct chain", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0x9876543210987654321098765432109876543210" };
      });

      // Mock context where we're already on Optimism
      const mockAppContextOptimism = {
        address: "0x1234567890123456789012345678901234567890",
        currentChainId: 10, // Already on Optimism
      };

      const platform = new MockDetailedHumanIDPlatform();
      await platform.getProviderPayload(mockAppContextOptimism);

      // Simulate transaction on same chain
      const mockTx = {
        chainId: "10", // Same as current
        to: "0xSBTContractAddress",
        value: "0",
        data: "0x1234",
      };

      await capturedPaymentCallback(mockTx);

      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: "0xSBTContractAddress",
        value: BigInt("0"),
        data: "0x1234",
      });
    });

    it("should handle different transaction value formats", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0x9876543210987654321098765432109876543210" };
      });

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(capturedPaymentCallback).toBeDefined();
      });

      // Test with undefined value (should default to 0)
      const mockTxUndefinedValue = {
        chainId: "10",
        to: "0xSBTContractAddress",
        data: "0x1234",
        // value is undefined
      };

      await capturedPaymentCallback(mockTxUndefinedValue);

      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: "0xSBTContractAddress",
        value: BigInt("0"),
        data: "0x1234",
      });
    });

    it("should handle large transaction values correctly", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0x9876543210987654321098765432109876543210" };
      });

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(capturedPaymentCallback).toBeDefined();
      });

      // Test with large value (1 ETH in wei)
      const mockTxLargeValue = {
        chainId: "10",
        to: "0xSBTContractAddress",
        value: "1000000000000000000", // 1 ETH
        data: "0x1234",
      };

      await capturedPaymentCallback(mockTxLargeValue);

      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: "0xSBTContractAddress",
        value: BigInt("1000000000000000000"),
        data: "0x1234",
      });
    });
  });

  describe("Simple vs Advanced Request Flow", () => {
    it("should support simple requestSBT flow without wallet interaction", async () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockSimpleHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockRequestSBT).toHaveBeenCalledWith("phone");
        // Simple flow should not trigger signature or transaction calls
        expect(mockSignMessageAsync).not.toHaveBeenCalled();
        expect(mockSendTransactionAsync).not.toHaveBeenCalled();
      });
    });

    it("should support advanced privateRequestSBT flow with full wallet integration", async () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockPrivateRequestSBT).toHaveBeenCalledWith(
          "phone",
          expect.objectContaining({
            signature: expect.any(String),
            address: expect.any(String),
            paymentCallback: expect.any(Function),
          })
        );
        // Advanced flow should trigger all wallet interactions
        expect(mockSignMessageAsync).toHaveBeenCalled();
      });
    });
  });

  describe("SBT Type Handling", () => {
    it("should support phone SBT type", async () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockDetailedHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockPrivateRequestSBT).toHaveBeenCalledWith("phone", expect.any(Object));
      });
    });

    it("should handle SBT recipient address in response", async () => {
      const customRecipientAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
      mockPrivateRequestSBT.mockResolvedValue({ recipient: customRecipientAddress });

      const platform = new MockDetailedHumanIDPlatform();
      const payload = await platform.getProviderPayload({
        address: "0x1234567890123456789012345678901234567890",
        currentChainId: 10,
      });

      expect(payload.humanId.sbtRecipient).toBe(customRecipientAddress);
    });
  });
});
