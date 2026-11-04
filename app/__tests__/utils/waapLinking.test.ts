import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@human.tech/waap-sdk", () => ({ WaaPWalletConnect: {}, initWaaP: vi.fn(), WAAP_METHOD: {} }));

import { classifyLinkError, holdActiveConnection, LinkCancelledError } from "../../utils/waapLinking";
import { wagmiConfig } from "../../utils/web3";

// Two connections, as during a link: the user's WaaP login and the wallet being linked.
const connection = (uid: string, account: string) => ({
  accounts: [account] as [`0x${string}`],
  chainId: 1,
  connector: { uid, id: uid } as any,
});

const setConnections = (current: string) =>
  wagmiConfig.setState((state) => ({
    ...state,
    status: "connected",
    current,
    connections: new Map([
      ["waap-uid", connection("waap-uid", "0x00000000000000000000000000000000000000a1")],
      ["metamask-uid", connection("metamask-uid", "0x00000000000000000000000000000000000000b2")],
    ]),
  }));

describe("holdActiveConnection", () => {
  beforeEach(() => setConnections("waap-uid"));

  it("switches straight back when the linked wallet becomes active", () => {
    const release = holdActiveConnection("waap-uid");

    wagmiConfig.setState((state) => ({ ...state, current: "metamask-uid" }));

    // Same tick: nothing could have rendered the other address in between.
    expect(wagmiConfig.state.current).toBe("waap-uid");
    release();
  });

  it("stops holding once released", () => {
    const release = holdActiveConnection("waap-uid");
    release();

    wagmiConfig.setState((state) => ({ ...state, current: "metamask-uid" }));

    expect(wagmiConfig.state.current).toBe("metamask-uid");
  });

  it("does nothing when the user's own connection is gone (a real logout)", () => {
    const release = holdActiveConnection("waap-uid");

    wagmiConfig.setState((state) => {
      const connections = new Map(state.connections);
      connections.delete("waap-uid");
      return { ...state, connections, current: "metamask-uid" };
    });

    expect(wagmiConfig.state.current).toBe("metamask-uid");
    release();
  });
});

describe("classifyLinkError", () => {
  it.each([
    ["the 422 cap, as a bare string", "This account already has the maximum of 5 linked wallets", "limit"],
    ["the 422 cap, as { error }", { error: "This account already has the maximum of 5 linked wallets" }, "limit"],
    ["the 409 conflict", { error: "Address is already linked to another account" }, "conflict"],
    ["a wallet rejection", { code: 4001, message: "User rejected the request." }, "cancelled"],
    ["a closed connect window", new LinkCancelledError(), "cancelled"],
    ["anything else", new Error("link 400 invalid domain"), "error"],
  ])("maps %s", (_label, error, expected) => {
    expect(classifyLinkError(error)).toBe(expected);
  });
});
