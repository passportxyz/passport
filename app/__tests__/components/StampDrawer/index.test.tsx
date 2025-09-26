import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { StampDrawer } from "../../../components/StampDrawer";
import { ChakraProvider } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";

vi.mock("../../../hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(() => true),
}));

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ address: "0x1234567890123456789012345678901234567890" })),
  useSignMessage: vi.fn(() => ({ signMessageAsync: vi.fn() })),
  useSendTransaction: vi.fn(() => ({ sendTransactionAsync: vi.fn() })),
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
});
