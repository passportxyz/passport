import { vi, describe, it, expect, beforeEach } from "vitest";
import { logoutHumanWallet } from "../../utils/humanWallet";

const win = window as unknown as { waap?: unknown; silk?: unknown };

// A logout that only finishes when the test says so, like the WaaP iframe round trip.
const pendingLogout = () => {
  let finish!: () => void;
  const logout = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
  return { logout, finish: () => finish() };
};

describe("logoutHumanWallet", () => {
  beforeEach(() => {
    delete win.waap;
    delete win.silk;
  });

  // The SDK sets window.waap and window.silk to the same object.
  it("logs out once when window.waap and window.silk are the same object", async () => {
    const provider = { logout: vi.fn() };
    win.waap = win.silk = provider;

    await logoutHumanWallet();

    expect(provider.logout).toHaveBeenCalledTimes(1);
  });

  it("logs out each distinct provider", async () => {
    win.waap = { logout: vi.fn() };
    win.silk = { logout: vi.fn() };

    await logoutHumanWallet();

    expect((win.waap as { logout: ReturnType<typeof vi.fn> }).logout).toHaveBeenCalledTimes(1);
    expect((win.silk as { logout: ReturnType<typeof vi.fn> }).logout).toHaveBeenCalledTimes(1);
  });

  // Disconnect, the WaaP connector and the session-cleared effect all ask for a logout together.
  it("shares one logout between overlapping callers", async () => {
    const { logout, finish } = pendingLogout();
    win.waap = win.silk = { logout };

    const first = logoutHumanWallet();
    const second = logoutHumanWallet();
    const third = logoutHumanWallet({ logout: vi.fn() });
    finish();
    await Promise.all([first, second, third]);

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("logs out again once the previous logout has finished", async () => {
    const provider = { logout: vi.fn() };
    win.waap = provider;

    await logoutHumanWallet();
    await logoutHumanWallet();

    expect(provider.logout).toHaveBeenCalledTimes(2);
  });

  it("uses the connector's provider when none is on window", async () => {
    const fallback = { logout: vi.fn() };

    await logoutHumanWallet(fallback);

    expect(fallback.logout).toHaveBeenCalledTimes(1);
  });

  it("still resolves when a logout fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    win.waap = { logout: vi.fn().mockRejectedValue(new Error("iframe gone")) };

    await expect(logoutHumanWallet()).resolves.toBeUndefined();
  });
});
