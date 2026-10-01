import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DashboardValidStampsPanel } from "../../components/DashboardValidStampsPanel";
import { useOnChainData } from "../../hooks/useOnChainData";

vi.mock("../../hooks/useOnChainData", () => ({ useOnChainData: vi.fn() }));
vi.mock("../../hooks/usePlatforms", () => ({ usePlatforms: () => ({ getPlatformSpec: vi.fn() }) }));
vi.mock("../../context/ceramicContext", async () => {
  const { createContext } = await import("react");
  return { CeramicContext: createContext({ verifiedPlatforms: {} }) };
});
vi.mock("../../components/InitiateOnChainButton", () => ({
  default: () => <button>Mint</button>,
}));

describe("DashboardValidStampsPanel chain errors", () => {
  beforeEach(() => cleanup());

  it("keeps mint controls available when only another chain failed", () => {
    vi.mocked(useOnChainData).mockReturnValue({
      activeChainProviders: [],
      isError: true,
      isActiveChainError: false,
      refresh: vi.fn(),
    } as any);
    render(<DashboardValidStampsPanel className="" />);
    expect(screen.getByRole("button", { name: "Mint" })).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load on-chain data.")).not.toBeInTheDocument();
  });

  it("shows an error and retries when the connected chain failed", () => {
    const refresh = vi.fn();
    vi.mocked(useOnChainData).mockReturnValue({
      activeChainProviders: [],
      isError: true,
      isActiveChainError: true,
      refresh,
    } as any);
    render(<DashboardValidStampsPanel className="" />);
    expect(screen.queryByRole("button", { name: "Mint" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
