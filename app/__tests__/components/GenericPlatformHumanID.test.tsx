import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { GenericPlatform } from "../../components/GenericPlatform";

// Mock Human ID SDK
import {
  mockInitHumanID,
  mockGetKeygenMessage,
  mockPrivateRequestSBT,
  resetHumanIDMocks,
} from "../../__mocks__/@holonym-foundation/human-id-sdk";

import { CeramicContextState } from "../../context/ceramicContext";
import { fetchVerifiableCredential } from "../../utils/credentials";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { ChakraProvider } from "@chakra-ui/react";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { PlatformScoreSpec } from "../../context/scorerContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// Mock wagmi hooks with more detailed behavior
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
    chain: { id: 10 }, // Optimism
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

// Mock HumanID Platform that returns special payload type
class MockHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";
  isEVM = true;

  banner = {
    heading: "To add the Human ID Phone Verification Stamp to your Passport...",
    content: React.createElement("div", {}, "Connect your wallet and verify your phone number through Human ID"),
    cta: {
      label: "Learn more",
      url: "https://human-id.org",
    },
  };

  async getProviderPayload(appContext: any) {
    // Return special HumanID payload that GenericPlatform should handle
    return {
      humanId: {
        action: "requestSBT",
        sbtType: "phone",
        requiresSignature: true,
        requiresTransaction: true,
      },
    };
  }
}

// Mock platform that simulates successful Human ID verification
class MockSuccessfulHumanIDPlatform extends MockHumanIDPlatform {
  async getProviderPayload(appContext: any) {
    const humanID = mockInitHumanID();
    const message = humanID.getKeygenMessage();

    // Simulate successful flow
    const signature = await mockSignMessageAsync({ message });

    const result = await humanID.privateRequestSBT("phone", {
      signature,
      address: appContext.address,
      paymentCallback: async (tx: any) => {
        await mockSwitchChainAsync({ chainId: Number(tx.chainId) });
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
        transactionHash: "0xmocktxhash",
        verified: true,
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

describe("GenericPlatform HumanID Integration", () => {
  beforeEach(async () => {
    await closeAllToasts();
    resetHumanIDMocks();
    vi.clearAllMocks();

    // Setup default successful mocks
    mockSignMessageAsync.mockResolvedValue("0xmocksignature");
    mockSendTransactionAsync.mockResolvedValue("0xmocktxhash");
    mockSwitchChainAsync.mockResolvedValue({});
    mockGetKeygenMessage.mockReturnValue("Sign this message to generate your HumanID verification key");
    mockPrivateRequestSBT.mockResolvedValue({ recipient: "0xrecipientaddress" });

    vi.mocked(fetchVerifiableCredential).mockResolvedValue({
      credentials: [
        {
          provider: "HumanIdPhone",
          credential: { credentialSubject: { hash: "mockhash" } },
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("HumanID Payload Handling", () => {
    it("should detect HumanID payload and trigger wallet interactions", async () => {
      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSuccessfulHumanIDPlatform()}
            platFormGroupSpec={mockHumanIDProviderConfig}
            platformScoreSpec={mockHumanIDScoreSpec}
            onClose={() => {}}
          />
        </ChakraProvider>
      );

      renderWithContext(mockCeramicContext, drawer());

      const verifyButton = screen.queryByTestId("button-verify-HumanID");
      expect(verifyButton).toBeInTheDocument();

      fireEvent.click(verifyButton as HTMLElement);

      await waitFor(() => {
        expect(mockInitHumanID).toHaveBeenCalled();
        expect(mockGetKeygenMessage).toHaveBeenCalled();
        expect(mockSignMessageAsync).toHaveBeenCalled();
        expect(mockPrivateRequestSBT).toHaveBeenCalled();
      });
    });

    it("should handle Human ID specific payload format", async () => {
      const platform = new MockHumanIDPlatform();
      const payload = await platform.getProviderPayload({});

      expect(payload).toEqual({
        humanId: {
          action: "requestSBT",
          sbtType: "phone",
          requiresSignature: true,
          requiresTransaction: true,
        },
      });
    });

    it("should show success message after successful Human ID verification", async () => {
      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSuccessfulHumanIDPlatform()}
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
        expect(screen.getByText("All HumanID data points verified.")).toBeInTheDocument();
      });
    });

    it("should handle chain switching during Human ID transaction", async () => {
      const drawer = () => (
        <ChakraProvider>
          <GenericPlatform
            isOpen={true}
            platform={new MockSuccessfulHumanIDPlatform()}
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
        expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: expect.any(Number) });
        expect(mockSendTransactionAsync).toHaveBeenCalledWith({
          to: expect.any(String),
          value: expect.any(BigInt),
          data: expect.any(String),
        });
      });
    });
  });

  describe("Wallet Integration", () => {
    it("should require wallet connection for Human ID verification", () => {
      const platform = new MockHumanIDPlatform();
      expect(platform.isEVM).toBe(true);
    });

    it("should pass correct address to Human ID verification", async () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockSuccessfulHumanIDPlatform()}
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
            address: "0x1234567890123456789012345678901234567890",
          })
        );
      });
    });
  });

  describe("Transaction Flow", () => {
    it("should handle payment callback with correct transaction parameters", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0xrecipientaddress" };
      });

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockSuccessfulHumanIDPlatform()}
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

      // Test the payment callback
      const mockTx = {
        chainId: "10",
        to: "0xcontractaddress",
        value: "100000000000000000",
        data: "0xmockdata",
      };

      const result = await capturedPaymentCallback(mockTx);

      expect(result).toEqual({
        txHash: "0xmocktxhash",
        chainId: 10,
      });
    });

    it("should handle zero value transactions", async () => {
      let capturedPaymentCallback: any;

      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0xrecipientaddress" };
      });

      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockSuccessfulHumanIDPlatform()}
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

      // Test with zero value transaction
      const mockTx = {
        chainId: "10",
        to: "0xcontractaddress",
        value: "0",
        data: "0xmockdata",
      };

      await capturedPaymentCallback(mockTx);

      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: "0xcontractaddress",
        value: BigInt("0"),
        data: "0xmockdata",
      });
    });
  });

  describe("Provider Configuration Handling", () => {
    it("should render Human ID provider options correctly", () => {
      const drawer = () => (
        <GenericPlatform
          isOpen={true}
          platform={new MockHumanIDPlatform()}
          platFormGroupSpec={mockHumanIDProviderConfig}
          platformScoreSpec={mockHumanIDScoreSpec}
          onClose={() => {}}
        />
      );

      renderWithContext(mockCeramicContext, drawer());

      expect(screen.getByText("Phone Verification")).toBeInTheDocument();
      expect(screen.getByText("Verify your phone number to receive a privacy-preserving SBT")).toBeInTheDocument();
      expect(screen.getByText("Phone SBT")).toBeInTheDocument();
      expect(screen.getByText("Proves you have verified your phone number")).toBeInTheDocument();
    });
  });
});
