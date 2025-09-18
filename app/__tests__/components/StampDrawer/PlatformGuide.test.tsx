import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlatformGuide } from "../../../components/StampDrawer/components/PlatformGuide";
import { useAccount, useSignMessage, useSendTransaction } from "wagmi";

// Mock wagmi hooks
vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useSignMessage: vi.fn(),
  useSendTransaction: vi.fn(),
}));

const mockSignMessageAsync = vi.fn();
const mockSendTransactionAsync = vi.fn();
const mockAddress = "0x1234567890123456789012345678901234567890";

describe("PlatformGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAccount as any).mockReturnValue({ address: mockAddress });
    (useSignMessage as any).mockReturnValue({ signMessageAsync: mockSignMessageAsync });
    (useSendTransaction as any).mockReturnValue({ sendTransactionAsync: mockSendTransactionAsync });
  });

  it("should render guide sections with steps", () => {
    const sections = [
      {
        title: "Getting Started",
        steps: [
          {
            number: 1,
            text: "Connect your wallet",
          },
          {
            number: 2,
            text: "Verify your identity",
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
        title: "Requirements",
        list: ["Valid ID", "Proof of address", "Recent photo"],
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
        title: "Resources",
        steps: [
          {
            number: 1,
            text: "Visit our website",
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
        title: "Actions",
        steps: [
          {
            number: 1,
            text: "Perform action",
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
    });
  });

  it("should not call onClick when no address is available", () => {
    (useAccount as any).mockReturnValue({ address: undefined });

    const mockOnClick = vi.fn();
    const sections = [
      {
        title: "Actions",
        steps: [
          {
            number: 1,
            text: "Perform action",
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
        title: "Navigation",
        steps: [
          {
            number: 1,
            text: "Go to page",
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
        title: "Mobile Guide",
        steps: [
          {
            number: 1,
            text: "Mobile step",
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
        title: "Multiple Actions",
        steps: [
          {
            number: 1,
            text: "Choose an action",
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
    });
  });
});
