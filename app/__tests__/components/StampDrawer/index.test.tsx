import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { StampDrawer } from "../../../components/StampDrawer";
import { ChakraProvider } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";

vi.mock("../../../hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(() => true),
}));

// Mock useCustomization to avoid platformMap import chain issues
vi.mock("../../../hooks/useCustomization", () => ({
  useCustomization: vi.fn(() => ({
    betaStamps: new Set(),
    scorer: { weights: {} },
  })),
}));

// Mock usePlatforms to avoid platformMap import issues with X platform
vi.mock("../../../hooks/usePlatforms", () => ({
  usePlatforms: vi.fn(() => new Map()),
}));

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ address: "0x1234567890123456789012345678901234567890" })),
  useSignMessage: vi.fn(() => ({ signMessageAsync: vi.fn() })),
  useSendTransaction: vi.fn(() => ({ sendTransactionAsync: vi.fn() })),
  useSwitchChain: vi.fn(() => ({ switchChainAsync: vi.fn() })),
}));

const mockPlatformSpec = {
  name: "Test Platform",
  icon: "/test-icon.png",
  description: "Test platform description",
  website: "https://test.com",
};

const mockCredentialGroups = [
  {
    platformGroup: "Test Group",
    providers: [
      {
        name: "TestProvider1" as PROVIDER_ID,
        title: "Test Provider 1",
        description: "Test description 1",
      },
      {
        name: "TestProvider2" as PROVIDER_ID,
        title: "Test Provider 2",
        description: "Test description 2",
      },
    ],
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  platformSpec: mockPlatformSpec,
  credentialGroups: mockCredentialGroups,
  onVerify: vi.fn(),
  verifiedProviders: [],
  expiredProviders: [],
  stampWeights: {
    TestProvider1: 1.5,
    TestProvider2: 2.0,
  },
  stampDedupStatus: {},
  isLoading: false,
};

const renderComponent = (props = {}) => {
  return render(
    <ChakraProvider>
      <StampDrawer {...defaultProps} {...props} />
    </ChakraProvider>
  );
};

describe("StampDrawer", () => {
  it("should render drawer when open", () => {
    renderComponent();
    expect(screen.getByText("Test Platform")).toBeInTheDocument();
    expect(screen.getByText("Test platform description")).toBeInTheDocument();
  });

  it("should display credential groups", () => {
    renderComponent();
    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("Test Provider 1")).toBeInTheDocument();
    expect(screen.getByText("Test Provider 2")).toBeInTheDocument();
  });

  it("should show verified state for verified providers", () => {
    renderComponent({
      verifiedProviders: ["TestProvider1"],
    });

    // Check that the verified credential has the correct background color
    const credentialCard = screen.getByText("Test Provider 1").closest("div[class*='rounded-xl']");
    expect(credentialCard).toHaveClass("bg-[#befee2]");
  });

  it("should calculate points correctly", () => {
    renderComponent({
      verifiedProviders: ["TestProvider1"],
    });

    // Should show 1.5/3.5 points gained
    expect(screen.getByText("1.5")).toBeInTheDocument();
    expect(screen.getByText("/3.5 points gained")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    renderComponent({ isLoading: true });
    // There are multiple "Verifying..." texts (in CTAButtons and DrawerFooter)
    const verifyingElements = screen.getAllByText("Verifying...");
    expect(verifyingElements.length).toBeGreaterThan(0);
  });

  it("should handle expired providers", () => {
    renderComponent({
      verifiedProviders: ["TestProvider1"],
      expiredProviders: ["TestProvider1"],
    });

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("should handle deduplicated stamps", () => {
    renderComponent({
      verifiedProviders: ["TestProvider1"],
      stampDedupStatus: { TestProvider1: true },
    });

    expect(screen.getByText("Deduplicated")).toBeInTheDocument();
  });

  describe("deprecated stamp filtering", () => {
    const credentialGroupsWithDeprecated = [
      {
        platformGroup: "Active Group",
        providers: [
          {
            name: "ActiveProvider" as PROVIDER_ID,
            title: "Active Provider",
            description: "Active provider description",
          },
        ],
      },
      {
        platformGroup: "Mixed Group",
        providers: [
          {
            name: "DeprecatedProvider" as PROVIDER_ID,
            title: "Deprecated Provider",
            description: "Deprecated provider description",
            isDeprecated: true,
          },
          {
            name: "AnotherActiveProvider" as PROVIDER_ID,
            title: "Another Active Provider",
            description: "Another active description",
          },
        ],
      },
      {
        platformGroup: "All Deprecated Group",
        providers: [
          {
            name: "FullyDeprecated" as PROVIDER_ID,
            title: "Fully Deprecated",
            description: "Fully deprecated description",
            isDeprecated: true,
          },
        ],
      },
    ];

    it("should hide deprecated stamps when user has not verified them", () => {
      renderComponent({
        credentialGroups: credentialGroupsWithDeprecated,
        verifiedProviders: [],
        stampWeights: {
          ActiveProvider: 1.0,
          DeprecatedProvider: 1.0,
          AnotherActiveProvider: 1.0,
          FullyDeprecated: 1.0,
        },
      });

      // Active providers should be visible
      expect(screen.getByText("Active Provider")).toBeInTheDocument();
      expect(screen.getByText("Another Active Provider")).toBeInTheDocument();

      // Deprecated providers should be hidden
      expect(screen.queryByText("Deprecated Provider")).not.toBeInTheDocument();
      expect(screen.queryByText("Fully Deprecated")).not.toBeInTheDocument();

      // Group with all deprecated providers should be hidden entirely
      expect(screen.queryByText("All Deprecated Group")).not.toBeInTheDocument();
    });

    it("should show deprecated stamps when user has already verified them", () => {
      renderComponent({
        credentialGroups: credentialGroupsWithDeprecated,
        verifiedProviders: ["DeprecatedProvider" as PROVIDER_ID],
        stampWeights: {
          ActiveProvider: 1.0,
          DeprecatedProvider: 1.0,
          AnotherActiveProvider: 1.0,
          FullyDeprecated: 1.0,
        },
      });

      // Active providers should be visible
      expect(screen.getByText("Active Provider")).toBeInTheDocument();
      expect(screen.getByText("Another Active Provider")).toBeInTheDocument();

      // Verified deprecated provider should be visible
      expect(screen.getByText("Deprecated Provider")).toBeInTheDocument();

      // Unverified deprecated provider should still be hidden
      expect(screen.queryByText("Fully Deprecated")).not.toBeInTheDocument();
    });

    it("should not include deprecated stamps in total possible points calculation", () => {
      renderComponent({
        credentialGroups: credentialGroupsWithDeprecated,
        verifiedProviders: [],
        stampWeights: {
          ActiveProvider: 1.0,
          DeprecatedProvider: 2.0,
          AnotherActiveProvider: 1.5,
          FullyDeprecated: 3.0,
        },
      });

      // Total should be 2.5 (1.0 + 1.5), not 7.5 (including deprecated)
      expect(screen.getByText("/2.5 points gained")).toBeInTheDocument();
    });
  });
});
