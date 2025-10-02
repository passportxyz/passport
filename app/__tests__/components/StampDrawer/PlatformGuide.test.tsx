import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlatformGuide } from "../../../components/StampDrawer/components/PlatformGuide";
import { useAccount, useSignMessage, useSendTransaction, useSwitchChain } from "wagmi";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useSignMessage: vi.fn(),
  useSendTransaction: vi.fn(),
  useSwitchChain: vi.fn(),
}));

const mockSignMessageAsync = vi.fn();
const mockSendTransactionAsync = vi.fn();
const mockSwitchChainAsync = vi.fn();
const mockAddress = "0x1234567890123456789012345678901234567890";

describe("PlatformGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAccount as any).mockReturnValue({ address: mockAddress });
    (useSignMessage as any).mockReturnValue({ signMessageAsync: mockSignMessageAsync });
    (useSendTransaction as any).mockReturnValue({ sendTransactionAsync: mockSendTransactionAsync });
    (useSwitchChain as any).mockReturnValue({ switchChainAsync: mockSwitchChainAsync });
  });

  it("should render guide sections with steps", () => {
    const sections = [
      {
        type: "steps" as const,
        title: "Getting Started",
        items: [
          {
            title: "Step 1",
            description: "Connect your wallet",
          },
          {
            title: "Step 2",
            description: "Verify your identity",
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Connect your wallet")).toBeInTheDocument();
    expect(screen.getByText("Verify your identity")).toBeInTheDocument();
  });

  it("should render lists in guide sections", () => {
    const sections = [
      {
        type: "list" as const,
        title: "Requirements",
        items: ["Valid ID", "Proof of address", "Recent photo"],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    expect(screen.getByText("Requirements")).toBeInTheDocument();
    expect(screen.getByText("Valid ID")).toBeInTheDocument();
    expect(screen.getByText("Proof of address")).toBeInTheDocument();
    expect(screen.getByText("Recent photo")).toBeInTheDocument();
  });

  it("should render external links with proper attributes", () => {
    const sections = [
      {
        type: "steps" as const,
        title: "Resources",
        items: [
          {
            title: "Step 1",
            description: "Visit our website",
            actions: [
              {
                label: "Go to Website",
                href: "https://example.com",
              },
            ],
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    const link = screen.getByText("Go to Website");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should handle onClick actions with wallet context when address is available", () => {
    const mockOnClick = vi.fn();
    const sections = [
      {
        type: "steps" as const,
        title: "Actions",
        items: [
          {
            title: "Step 1",
            description: "Perform action",
            actions: [
              {
                label: "Click Me",
                onClick: mockOnClick,
              },
            ],
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    const button = screen.getByText("Click Me");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledWith({
      address: mockAddress,
      signMessageAsync: mockSignMessageAsync,
      sendTransactionAsync: mockSendTransactionAsync,
      switchChainAsync: mockSwitchChainAsync,
    });
  });

  it("should not call onClick when no address is available", () => {
    (useAccount as any).mockReturnValue({ address: undefined });

    const mockOnClick = vi.fn();
    const sections = [
      {
        type: "steps" as const,
        title: "Actions",
        items: [
          {
            title: "Step 1",
            description: "Perform action",
            actions: [
              {
                label: "Click Me",
                onClick: mockOnClick,
              },
            ],
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    const button = screen.getByText("Click Me");
    fireEvent.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should handle internal links without external attributes", () => {
    const sections = [
      {
        type: "steps" as const,
        title: "Navigation",
        items: [
          {
            title: "Step 1",
            description: "Go to page",
            actions: [
              {
                label: "Internal Link",
                href: "/internal-page",
              },
            ],
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    const link = screen.getByText("Internal Link");
    expect(link).toHaveAttribute("href", "/internal-page");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("should render correctly on mobile", () => {
    const sections = [
      {
        type: "steps" as const,
        title: "Mobile Guide",
        items: [
          {
            title: "Step 1",
            description: "Mobile step",
          },
        ],
      },
    ];

    const { container } = render(<PlatformGuide sections={sections} isMobile={true} />);

    expect(container.querySelector(".mt-8")).toBeInTheDocument();
  });

  it("should render multiple actions for a step", () => {
    const mockOnClick1 = vi.fn();
    const mockOnClick2 = vi.fn();

    const sections = [
      {
        type: "steps" as const,
        title: "Multiple Actions",
        items: [
          {
            title: "Step 1",
            description: "Choose an action",
            actions: [
              {
                label: "Action 1",
                onClick: mockOnClick1,
              },
              {
                label: "Action 2",
                href: "https://example.com",
              },
            ],
          },
        ],
      },
    ];

    render(<PlatformGuide sections={sections} />);

    const action1 = screen.getByText("Action 1");
    const action2 = screen.getByText("Action 2");

    expect(action1).toBeInTheDocument();
    expect(action2).toBeInTheDocument();

    fireEvent.click(action1);
    expect(mockOnClick1).toHaveBeenCalledWith({
      address: mockAddress,
      signMessageAsync: mockSignMessageAsync,
      sendTransactionAsync: mockSendTransactionAsync,
      switchChainAsync: mockSwitchChainAsync,
    });
  });
});
