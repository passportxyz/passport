import { vi, describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

const order: string[] = [];
const disconnectAsync = vi.fn(async () => {
  order.push("wagmi disconnect");
});
// Never settles, like a slow WaaP iframe: Disconnect must not wait for it.
const logoutHumanWallet = vi.fn(() => {
  order.push("waap logout");
  return new Promise<void>(() => {});
});

vi.mock("wagmi", () => ({ useDisconnect: () => ({ disconnectAsync }) }));
vi.mock("../../utils/humanWallet", () => ({ logoutHumanWallet: () => logoutHumanWallet() }));

import { useCustomDisconnect } from "../../hooks/useCustomDisconnect";

describe("useCustomDisconnect", () => {
  it("disconnects wagmi first and doesn't wait for the WaaP logout", async () => {
    const { result } = renderHook(() => useCustomDisconnect());

    await result.current.disconnect();

    expect(order).toEqual(["wagmi disconnect", "waap logout"]);
  });
});
