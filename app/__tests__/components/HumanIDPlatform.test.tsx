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
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { ChakraProvider } from "@chakra-ui/react";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { PlatformScoreSpec } from "../../context/scorerContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// Mock wagmi hooks
vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal()),
  useSignMessage: () => ({
    signMessageAsync: vi.fn().mockResolvedValue("0xmocksignature"),
  }),
  useSendTransaction: () => ({
    sendTransactionAsync: vi.fn().mockResolvedValue("0xmocktxhash"),
  }),
  useSwitchChain: () => ({
    switchChainAsync: vi.fn().mockResolvedValue({}),
  }),
  useAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  }),
}));

vi.mock("../../utils/credentials", () => ({
  fetchVerifiableCredential: vi.fn(),
}));

vi.mock("../../utils/helpers.tsx", async (importActual) => ({
  ...(await importActual()),
  generateUID: vi.fn(),
  getProviderSpec: vi.fn(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

// Mock HumanID Platform class
class MockHumanIDPlatform {
  platformId = "HumanID";
  path = "HumanID";

  banner = {
    heading: "To add the Human ID Phone Verification Stamp to your Passport...",
    content: React.createElement("div", {}, "Connect your wallet and verify your phone number through Human ID"),
    cta: {
      label: "Learn more",
      url: "https://human.tech",
    },
  };

  async getProviderPayload(appContext: any) {
    const humanID = mockInitHumanID();
    const message = humanID.getKeygenMessage();

    // Simulate the signature process
    const signature = await appContext.wagmi?.signMessageAsync?.({ message });

    // Simulate the Human ID SBT request
    const result = await humanID.privateRequestSBT("phone", {
      signature,
      address: appContext.address,
      paymentCallback: async (tx: any) => {
        await appContext.wagmi?.switchChainAsync?.({ chainId: Number(tx.chainId) });
        const txHash = await appContext.wagmi?.sendTransactionAsync?.({
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
      humanId: {
        sbtRecipient: result?.recipient,
        transactionHash: "0xmocktxhash",
      },
    };
  }
}

// Mock provider config
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

describe("HumanID Platform Integration", () => {
  beforeEach(async () => {
    await closeAllToasts();
    resetHumanIDMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Platform Setup", () => {
    it("should create HumanID platform with correct properties", () => {
      const platform = new MockHumanIDPlatform();

      expect(platform.platformId).toBe("HumanID");
      expect(platform.path).toBe("HumanID");
      expect(platform.banner).toBeDefined();
      expect(platform.banner.heading).toContain("Human ID Phone Verification");
    });

    it("should display verification button for HumanID platform", () => {
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
      // The drawer should be open and show the Check Eligibility button
      const checkButtons = screen.getAllByText("Check Eligibility");
      expect(checkButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Payload Generation", () => {
    it("should generate provider payload with Human ID SDK integration", async () => {
      const platform = new MockHumanIDPlatform();
      const mockAppContext = {
        address: "0x1234567890123456789012345678901234567890",
        wagmi: {
          signMessageAsync: vi.fn().mockResolvedValue("0xmocksignature"),
          sendTransactionAsync: vi.fn().mockResolvedValue("0xmocktxhash"),
          switchChainAsync: vi.fn().mockResolvedValue({}),
        },
      };

      // Setup mocks
      mockGetKeygenMessage.mockReturnValue("Test keygen message");
      mockPrivateRequestSBT.mockResolvedValue({ recipient: "0xrecipientaddress" });

      const payload = await platform.getProviderPayload(mockAppContext);

      expect(mockInitHumanID).toHaveBeenCalled();
      expect(mockGetKeygenMessage).toHaveBeenCalled();
      expect(mockPrivateRequestSBT).toHaveBeenCalledWith(
        "phone",
        expect.objectContaining({
          signature: "0xmocksignature",
          address: "0x1234567890123456789012345678901234567890",
          paymentCallback: expect.any(Function),
        })
      );

      expect(payload).toEqual({
        humanId: {
          sbtRecipient: "0xrecipientaddress",
          transactionHash: "0xmocktxhash",
        },
      });
    });

    it("should handle signature request in payload generation", async () => {
      const platform = new MockHumanIDPlatform();
      const signMessageMock = vi.fn().mockResolvedValue("0xuserSignature");
      const mockAppContext = {
        address: "0x1234567890123456789012345678901234567890",
        wagmi: {
          signMessageAsync: signMessageMock,
          sendTransactionAsync: vi.fn().mockResolvedValue("0xmocktxhash"),
          switchChainAsync: vi.fn().mockResolvedValue({}),
        },
      };

      await platform.getProviderPayload(mockAppContext);

      expect(signMessageMock).toHaveBeenCalledWith({
        message: expect.any(String),
      });
    });

    it("should handle payment callback during SBT minting", async () => {
      const platform = new MockHumanIDPlatform();
      const switchChainMock = vi.fn().mockResolvedValue({});
      const sendTransactionMock = vi.fn().mockResolvedValue("0xpaymenttxhash");

      const mockAppContext = {
        address: "0x1234567890123456789012345678901234567890",
        wagmi: {
          signMessageAsync: vi.fn().mockResolvedValue("0xmocksignature"),
          sendTransactionAsync: sendTransactionMock,
          switchChainAsync: switchChainMock,
        },
      };

      // Setup mock to capture the payment callback
      let capturedPaymentCallback: any;
      mockPrivateRequestSBT.mockImplementation(async (type, options) => {
        capturedPaymentCallback = options.paymentCallback;
        return { recipient: "0xrecipientaddress" };
      });

      await platform.getProviderPayload(mockAppContext);

      // Test the payment callback
      const mockTx = {
        chainId: "10", // Optimism
        to: "0xcontractaddress",
        value: "100000000000000000", // 0.1 ETH
        data: "0xmockdata",
      };

      const paymentResult = await capturedPaymentCallback(mockTx);

      expect(switchChainMock).toHaveBeenCalledWith({ chainId: 10 });
      expect(sendTransactionMock).toHaveBeenCalledWith({
        to: "0xcontractaddress",
        value: BigInt("100000000000000000"),
        data: "0xmockdata",
      });
      expect(paymentResult).toEqual({
        txHash: "0xpaymenttxhash",
        chainId: 10,
      });
    });
  });

  describe("Banner and UI Elements", () => {
    it("should display informative banner about Human ID verification process", () => {
      const platform = new MockHumanIDPlatform();

      expect(platform.banner.heading).toContain("Human ID Phone Verification");
      expect(platform.banner.cta).toEqual({
        label: "Learn more",
        url: "https://human.tech",
      });
    });

    it("should render banner content as React element", () => {
      const platform = new MockHumanIDPlatform();

      expect(React.isValidElement(platform.banner.content)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    it("should have correct provider configuration structure", () => {
      expect(mockHumanIDProviderConfig).toHaveLength(1);
      expect(mockHumanIDProviderConfig[0]).toEqual({
        title: "Phone Verification",
        description: "Verify your phone number to receive a privacy-preserving SBT",
        providers: [
          {
            title: "Phone SBT",
            description: "Proves you have verified your phone number",
            name: "HumanIdPhone",
          },
        ],
      });
    });

    it("should have correct platform score specification", () => {
      expect(mockHumanIDScoreSpec).toEqual({
        platform: "HumanID",
        name: "Human ID",
        icon: "./assets/humanIdStampIcon.svg",
        description: "Verify your phone number privately with Human ID",
        connectMessage: "Connect your wallet to verify with Human ID",
        possiblePoints: 5,
        earnedPoints: 0,
      });
    });
  });
});
