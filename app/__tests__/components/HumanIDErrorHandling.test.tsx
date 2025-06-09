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

// Mock wagmi hooks with error scenarios
const mockSignMessageAsync = vi.fn();
const mockSendTransactionAsync = vi.fn();
const mockSwitchChainAsync = vi.fn();

vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal()),
  useSignMessage: () => ({
    signMessageAsync: mockSignMessageAsync,
  }),
  useSendTransaction: () => ({
    sendTransactionAsync: mockSendTransactionAsync,
  }),
  useSwitchChain: () => ({
    switchChainAsync: mockSwitchChainAsync,
  }),
  useAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
    chain: { id: 1 },
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

// Platform that handles errors gracefully
class MockErrorHandlingHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";
  isEVM = true;

  async getProviderPayload(appContext: any) {
    try {
      const humanID = mockInitHumanID();
      const message = humanID.getKeygenMessage();

      // This will throw if signature fails
      const signature = await mockSignMessageAsync({ message });

      const result = await humanID.privateRequestSBT("phone", {
        signature,
        address: appContext.address,
        paymentCallback: async (tx: any) => {
          // This will throw if chain switch fails
          await mockSwitchChainAsync({ chainId: Number(tx.chainId) });

          // This will throw if transaction fails
          const txHash = await mockSendTransactionAsync({
            to: tx.to,
            value: BigInt(tx.value ?? "0"),
            data: tx.data,
          });

          return { txHash, chainId: Number(tx.chainId) };
        },
      });

      return {
        address: appContext.address,
        humanId: {
          sbtRecipient: result?.recipient,
          completed: true,
        },
      };
    } catch (error) {
      // Platform should handle and rethrow with context
      throw new Error(`Human ID verification failed: ${error.message}`);
    }
  }
}

// Platform that simulates SDK errors
class MockSDKErrorHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";
  isEVM = true;

  async getProviderPayload(appContext: any) {
    const humanID = mockInitHumanID();

    // This might throw if SDK is not properly initialized
    const message = humanID.getKeygenMessage();

    const signature = await mockSignMessageAsync({ message });

    // This will throw if Human ID service has issues
    const result = await humanID.privateRequestSBT("phone", {
      signature,
      address: appContext.address,
      paymentCallback: async (tx: any) => {
        const txHash = await mockSendTransactionAsync({
          to: tx.to,
          value: BigInt(tx.value ?? "0"),
          data: tx.data,
        });
        return { txHash, chainId: Number(tx.chainId) };
      },
    });

    return {
      address: appContext.address,
      humanId: {
        sbtRecipient: result?.recipient,
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

describe("Human ID Error Handling", () => {
  beforeEach(async () => {
    await closeAllToasts();
    resetHumanIDMocks();
    vi.clearAllMocks();

    // Default setup
    mockGetKeygenMessage.mockReturnValue("Sign this message");
    vi.mocked(fetchVerifiableCredential).mockResolvedValue({ credentials: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Signature Rejection Errors", () => {
    it("should handle user rejecting signature request", async () => {
      mockSignMessageAsync.mockRejectedValue(new Error("User rejected the request"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle wallet connection errors during signature", async () => {
      mockSignMessageAsync.mockRejectedValue(new Error("Wallet not connected"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle malformed signature responses", async () => {
      mockSignMessageAsync.mockResolvedValue(""); // Empty signature

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Transaction Failure Errors", () => {
    it("should handle insufficient gas errors", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSendTransactionAsync.mockRejectedValue(new Error("insufficient funds for gas * price + value"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle user rejecting transaction", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSendTransactionAsync.mockRejectedValue(new Error("User denied transaction signature"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle transaction timeout errors", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSendTransactionAsync.mockRejectedValue(new Error("Transaction timeout"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Chain Switching Errors", () => {
    it("should handle chain switch rejection", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSwitchChainAsync.mockRejectedValue(new Error("User rejected the request"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle unsupported chain errors", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSwitchChainAsync.mockRejectedValue(new Error("Unrecognized chain ID"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Human ID SDK Errors", () => {
    it("should handle Human ID service unavailable", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockPrivateRequestSBT.mockRejectedValue(new Error("Human ID service temporarily unavailable"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSDKErrorHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle invalid verification data", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockPrivateRequestSBT.mockRejectedValue(new Error("Invalid phone verification data"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSDKErrorHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle SBT already exists error", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockPrivateRequestSBT.mockRejectedValue(new Error("SBT already exists for this address"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSDKErrorHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle keygen message generation failure", async () => {
      mockGetKeygenMessage.mockImplementation(() => {
        throw new Error("Failed to generate keygen message");
      });

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSDKErrorHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Network Issues", () => {
    it("should handle network connectivity errors", async () => {
      mockSignMessageAsync.mockRejectedValue(new Error("Network Error"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle RPC endpoint failures", async () => {
      mockSignMessageAsync.mockResolvedValue("0x1234");
      mockSendTransactionAsync.mockRejectedValue(new Error("RPC endpoint failed"));

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Invalid State Errors", () => {
    it("should handle missing wallet address", async () => {
      const mockContextNoAddress = {
        ...mockCeramicContext,
        address: undefined,
      };

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
            platFormGroupSpec={mockHumanIDProviderConfig}
            platformScoreSpec={mockHumanIDScoreSpec}
            onClose={() => {}}
          />
        </ChakraProvider>
      );

      renderWithContext(mockContextNoAddress, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });

    it("should handle invalid Human ID SDK initialization", async () => {
      mockInitHumanID.mockImplementation(() => {
        throw new Error("SDK initialization failed");
      });

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSDKErrorHumanIDPlatform()}
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
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });
    });
  });

  describe("Recovery and Retry Scenarios", () => {
    it("should allow retry after signature failure", async () => {
      // First attempt fails
      mockSignMessageAsync.mockRejectedValueOnce(new Error("User rejected"));
      // Second attempt succeeds
      mockSignMessageAsync.mockResolvedValueOnce("0x1234");
      mockPrivateRequestSBT.mockResolvedValueOnce({ recipient: "0xabc123" });

      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockErrorHandlingHumanIDPlatform()}
            platFormGroupSpec={mockHumanIDProviderConfig}
            platformScoreSpec={mockHumanIDScoreSpec}
            onClose={() => {}}
          />
        </ChakraProvider>
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");

      // First attempt
      fireEvent.click(verifyButton as HTMLElement);
      await waitFor(() => {
        expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
      });

      // Second attempt
      fireEvent.click(verifyButton as HTMLElement);
      await waitFor(() => {
        expect(mockSignMessageAsync).toHaveBeenCalledTimes(2);
      });
    });
  });
});
