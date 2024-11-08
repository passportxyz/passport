import { vi, describe, it, expect, Mock } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Notifications } from "../../components/Notifications";
import { useNotifications, useDismissNotification, useDeleteAllNotifications } from "../../hooks/useNotifications";
import { StampClaimingContext } from "../../context/stampClaimingContext";
import { CeramicContext } from "../../context/ceramicContext";

// Mock the hooks and contexts
vi.mock("../../hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
  useDismissNotification: vi.fn(),
  useDeleteAllNotifications: vi.fn(),
}));
vi.mock("../../context/stampClaimingContext");
vi.mock("../../context/ceramicContext");

const mockSetShowSidebar = vi.fn();
const mockDeleteMutation = { mutate: vi.fn() };

describe("Notifications Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDeleteAllNotifications as Mock).mockReturnValue(mockDeleteMutation);
  });

  it("should render without notifications", async () => {
    (useNotifications as Mock).mockReturnValue({ notifications: [] });
    render(<Notifications setShowSidebar={mockSetShowSidebar} />);
    await waitFor(() => {});

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    await waitFor(() => {});

    expect(
      screen.getByText("You have no notifications. We’ll let you know when there’s something.")
    ).toBeInTheDocument();
  });

  it("should render read notification", async () => {
    (useNotifications as Mock).mockReturnValue({
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

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    await waitFor(() => {});
    expect(screen.getByText(`Test notification`)).toBeInTheDocument();
    expect(screen.getByTestId("read-indicator")).toHaveClass("bg-background-5");
  });

  it("should render unread notification", async () => {
    (useNotifications as Mock).mockReturnValue({
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

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    await waitFor(() => {});
    expect(screen.getByText(`Test notification`)).toBeInTheDocument();
    expect(screen.getByTestId("read-indicator")).toHaveClass("bg-transparent");
  });

  it("should handle delete all notifications", async () => {
    (useNotifications as Mock).mockReturnValue({
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

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    const deleteButton = screen.getByText("Delete All");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteMutation.mutate).toHaveBeenCalled();
    });
  });

  it("should not show delete all button when there are no notifications", async () => {
    (useNotifications as Mock).mockReturnValue({ notifications: [] });
    render(<Notifications setShowSidebar={mockSetShowSidebar} />);

    const noteBell = screen.getByTestId("notification-bell");
    fireEvent.click(noteBell);

    await waitFor(() => {
      expect(screen.queryByText("Delete All")).not.toBeInTheDocument();
    });
  });
});
