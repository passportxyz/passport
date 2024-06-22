import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Notifications } from "../../components/Notifications";
import { useNotifications, useDismissNotification } from "../../hooks/useNotifications";
import { StampClaimingContext } from "../../context/stampClaimingContext";
import { CeramicContext } from "../../context/ceramicContext";

// Mock the hooks and contexts
jest.mock("../../hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
  useDismissNotification: jest.fn(),
}));
jest.mock("../../context/stampClaimingContext");
jest.mock("../../context/ceramicContext");

const mockSetShowSidebar = jest.fn();

describe("Notifications Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without notifications", async () => {
    (useNotifications as jest.Mock).mockReturnValue({ notifications: [] });

    render(<Notifications setShowSidebar={mockSetShowSidebar} />);
    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    await waitFor(() => {
      expect(screen.getByText("Congrats! You have no notifications.")).toBeInTheDocument();
    });
  });
  it("should render read notification", async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        {
          notification_id: "1",
          type: "on_chain_expiry",
          content: "Test notification",
          is_read: false,
          link: "https://example.com",
        },
      ],
    });

    render(<Notifications setShowSidebar={mockSetShowSidebar} />);

    await waitFor(() => {});

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    expect(screen.getByText(`Test notification`)).toBeInTheDocument();
    expect(screen.getByTestId("read-indicator")).toHaveClass("bg-background-5");
  });
  it("should render unread notification", async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        {
          notification_id: "1",
          type: "on_chain_expiry",
          content: "Test notification",
          is_read: true,
          link: "https://example.com",
        },
      ],
    });

    render(<Notifications setShowSidebar={mockSetShowSidebar} />);

    await waitFor(() => {});

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    expect(screen.getByText(`Test notification`)).toBeInTheDocument();
    expect(screen.getByTestId("read-indicator")).toHaveClass("bg-transparent");
  });
});
