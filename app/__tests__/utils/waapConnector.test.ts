import { vi, describe, it, expect, beforeEach } from "vitest";

// A stand-in for the WaaP SDK provider: login() returns whichever method the user picked.
const provider = {
  connected: false,
  login: vi.fn(),
  getLoginMethod: vi.fn(),
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@human.tech/waap-sdk", () => ({
  initWaaP: () => provider,
  WAAP_METHOD: {
    eth_accounts: "eth_accounts",
    eth_chainId: "eth_chainId",
    eth_requestAccounts: "eth_requestAccounts",
    wallet_switchEthereumChain: "wallet_switchEthereumChain",
  },
}));

import { getAddress } from "viem";
import { mainnet } from "viem/chains";
import { ExternalWalletLoginError, isExternalWalletLogin, WaaPConfig, waapConnector } from "../../utils/waap";

const makeConnector = () =>
  waapConnector({
    chains: [mainnet],
    emitter: { emit: vi.fn(), on: vi.fn(), off: vi.fn(), once: vi.fn() },
    storage: null,
  } as any);

describe("WaaP connector and external wallets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    provider.request.mockImplementation(async ({ method }: { method: string }) =>
      method === "eth_chainId" ? "0x1" : ["0x1234567890abcdef1234567890abcdef12345678"]
    );
  });

  it("offers external wallets in the WaaP login window", () => {
    expect(WaaPConfig.config?.authenticationMethods).toContain("wallet");
  });

  it("connects a WaaP account as before", async () => {
    provider.login.mockResolvedValue("waap");

    const result = await makeConnector().connect();

    expect(result.accounts).toEqual([getAddress("0x1234567890abcdef1234567890abcdef12345678")]);
  });

  it.each(["injected", "walletconnect"] as const)(
    "reports a %s choice instead of connecting it as a WaaP account",
    async (method) => {
      provider.login.mockResolvedValue(method);

      const error = await makeConnector()
        .connect()
        .catch((e: unknown) => e);

      expect(isExternalWalletLogin(error)).toBe(true);
      expect((error as ExternalWalletLoginError).loginMethod).toBe(method);
      expect(provider.request).not.toHaveBeenCalledWith({ method: "eth_accounts" });
    }
  );

  it("never auto-reconnects an external wallet login as a WaaP account", async () => {
    provider.getLoginMethod.mockReturnValue("injected");

    expect(await makeConnector().isAuthorized()).toBe(false);
    expect(provider.request).not.toHaveBeenCalled();
  });

  it("still auto-reconnects a stored WaaP session", async () => {
    provider.getLoginMethod.mockReturnValue("waap");

    expect(await makeConnector().isAuthorized()).toBe(true);
  });

  // A connector that didn't connect must not hear a later SDK logout while another wallet is used.
  it("stops listening to the SDK when a browser wallet is chosen instead", async () => {
    provider.login.mockResolvedValue("injected");

    await makeConnector()
      .connect()
      .catch(() => undefined);

    // After connect() added its listeners, the last calls on the provider remove them again.
    const lastThree = provider.removeListener.mock.calls.slice(-3).map(([event]) => event);
    expect(lastThree).toEqual(["accountsChanged", "chainChanged", "disconnect"]);
    expect(provider.on.mock.invocationCallOrder.at(-1)!).toBeLessThan(
      provider.removeListener.mock.invocationCallOrder.at(-1)!
    );
  });

  it("logs the WaaP session out once on disconnect", async () => {
    provider.login.mockResolvedValue("waap");
    const connector = makeConnector();
    await connector.connect();

    await connector.disconnect();
    await Promise.resolve();

    expect(provider.logout).toHaveBeenCalledTimes(1);
  });
});
