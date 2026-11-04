import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const connectAsync = vi.fn();
const failure = vi.fn();
const navigateToPage = vi.fn();
const connectDatastore = vi.fn();
// window.ethereum, and the providers wagmi's connectors return.
const ethereum = { isMetaMask: true };
const otherWallet = {};
const waap = { id: "waap", name: "Human Wallet", type: "waap", getProvider: async () => ({}) };
const injected = { id: "injected", name: "Injected", type: "injected", getProvider: async () => ethereum };
const announcedConnector = (id: string, provider: object) => ({
  id,
  name: id,
  type: "injected",
  getProvider: async () => provider,
});
let connectors: object[] = [];
let account: Record<string, unknown> = {};
let dbAccessTokenStatus = "idle";

vi.mock("wagmi", () => ({
  useAccount: () => account,
  useWalletClient: () => ({ data: { signMessage: vi.fn() } }),
  useSwitchChain: () => ({ switchChainAsync: vi.fn() }),
  useConnect: () => ({ connectAsync, connectors }),
}));

vi.mock("../../context/datastoreConnectionContext", () => ({
  hasValidStoredSession: () => false,
  useDatastoreConnectionContext: () => ({ dbAccessTokenStatus, connect: connectDatastore }),
}));

vi.mock("../../hooks/useCustomization", () => ({ useNavigateToPage: () => navigateToPage }));
vi.mock("../../hooks/useMessage", () => ({ useMessage: () => ({ failure }) }));
vi.mock("../../hooks/useWalletPicker", () => ({ openWalletPicker: vi.fn() }));
vi.mock("@datadog/browser-rum", () => ({ datadogRum: { addError: vi.fn() } }));

vi.mock("../../utils/waap", async () => {
  class ExternalWalletLoginError extends Error {
    override name = "ExternalWalletLoginError";
    constructor(readonly loginMethod: "injected" | "walletconnect") {
      super(loginMethod);
    }
  }
  return {
    WAAP_CONNECTOR_ID: "waap",
    waapConnector: {},
    ExternalWalletLoginError,
    isExternalWalletLogin: (e: unknown) => (e as Error)?.name === "ExternalWalletLoginError",
    isWaaPConnector: (c?: { id: string }) => c?.id === "waap",
  };
});

import { LoginFlowProvider, useLoginFlow } from "../../hooks/useLoginFlow";
import { markOnboardingSeen } from "../../utils/onboardingStatus";
import { ExternalWalletLoginError } from "../../utils/waap";

const wrapper = ({ children }: { children: React.ReactNode }) => <LoginFlowProvider>{children}</LoginFlowProvider>;
const renderLoginFlow = () => renderHook(() => useLoginFlow(), { wrapper });

const signInWithWaap = async () => {
  const { result } = renderLoginFlow();
  await act(async () => {
    await result.current.signIn({ useWaap: true });
  });
};

beforeEach(() => {
  connectAsync.mockReset();
  failure.mockReset();
  navigateToPage.mockReset();
  connectDatastore.mockReset();
  connectors = [waap, injected];
  account = { isConnected: false };
  dbAccessTokenStatus = "idle";
  (window as { ethereum?: object }).ethereum = ethereum;
  localStorage.clear();
});

describe("useLoginFlow: external wallet chosen in the WaaP window", () => {
  it("connects a WaaP account through the WaaP connector only", async () => {
    connectAsync.mockResolvedValue({});

    await signInWithWaap();

    expect(connectAsync).toHaveBeenCalledTimes(1);
    expect(connectAsync).toHaveBeenCalledWith({ connector: waap });
    expect(failure).not.toHaveBeenCalled();
  });

  it("hands a browser wallet over to wagmi's injected connector when none is announced", async () => {
    connectAsync.mockRejectedValueOnce(new ExternalWalletLoginError("injected")).mockResolvedValueOnce({});

    await signInWithWaap();

    expect(connectAsync).toHaveBeenNthCalledWith(2, { connector: injected });
    expect(failure).not.toHaveBeenCalled();
  });

  // The announced connector connects itself once the wallet approves, so it's the one to use:
  // connecting `injected` too would leave two connections for one wallet.
  it("uses the announced connector whose provider is window.ethereum", async () => {
    const rabby = announcedConnector("io.rabby", otherWallet);
    const metaMask = announcedConnector("io.metamask", ethereum);
    connectors = [waap, rabby, metaMask, injected];
    connectAsync.mockRejectedValueOnce(new ExternalWalletLoginError("injected")).mockResolvedValueOnce({});

    await signInWithWaap();

    expect(connectAsync).toHaveBeenCalledTimes(2);
    expect(connectAsync).toHaveBeenNthCalledWith(2, { connector: metaMask });
  });

  it("falls back to MetaMask's announced connector when it wraps window.ethereum", async () => {
    const metaMask = announcedConnector("io.metamask", { wrapper: true });
    connectors = [waap, metaMask, injected];
    connectAsync.mockRejectedValueOnce(new ExternalWalletLoginError("injected")).mockResolvedValueOnce({});

    await signInWithWaap();

    expect(connectAsync).toHaveBeenNthCalledWith(2, { connector: metaMask });
  });

  it("explains that WalletConnect isn't available yet", async () => {
    connectAsync.mockRejectedValueOnce(new ExternalWalletLoginError("walletconnect"));

    await signInWithWaap();

    expect(connectAsync).toHaveBeenCalledTimes(1);
    expect(failure).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/WalletConnect sign-in isn't available yet/) })
    );
  });
});

// One login for the whole app (LoginFlowProvider): the header and Home share it.
describe("LoginFlowProvider", () => {
  const loggedIn = (connectorId: string) => {
    account = { isConnected: true, address: "0xabc", connector: { id: connectorId } };
    dbAccessTokenStatus = "connected";
  };

  it("refuses to run outside the provider, instead of a private copy", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useLoginFlow())).toThrow(/inside LoginFlowProvider/);
  });

  it("gives every caller the same login state", async () => {
    const { result } = renderHook(() => [useLoginFlow(), useLoginFlow()] as const, { wrapper });
    account = { isConnected: true, address: "0xabc" };

    await act(async () => {
      await result.current[0].signIn({ useWaap: true });
    });

    expect(result.current[0].isBusy).toBe(true);
    expect(result.current[1].isBusy).toBe(true);
  });

  it.each(["isConnecting", "isReconnecting"])("is busy while wagmi is %s", (flag) => {
    account = { isConnected: false, [flag]: true };
    expect(renderLoginFlow().result.current.isBusy).toBe(true);
  });

  // Onboarding on an account's first login on this device, for every kind of wallet.
  it.each(["waap", "io.metamask"])("sends a first-time %s account to onboarding, once", async (connectorId) => {
    loggedIn(connectorId);
    const { result } = renderLoginFlow();

    await act(async () => {
      await result.current.signIn({ useWaap: true });
    });

    expect(navigateToPage).toHaveBeenCalledTimes(1);
    expect(navigateToPage).toHaveBeenCalledWith("wallet-onboarding");
    expect(result.current.isBusy).toBe(false);
  });

  it("sends an account that has seen onboarding on this device to the dashboard", async () => {
    loggedIn("waap");
    markOnboardingSeen("0xABC");
    const { result } = renderLoginFlow();

    await act(async () => {
      await result.current.signIn({ useWaap: true });
    });

    expect(navigateToPage).toHaveBeenCalledWith("dashboard");
  });

  it("shows onboarding again for a different account", async () => {
    loggedIn("waap");
    markOnboardingSeen("0xdef");
    const { result } = renderLoginFlow();

    await act(async () => {
      await result.current.signIn();
    });

    expect(navigateToPage).toHaveBeenCalledWith("wallet-onboarding");
  });

  // The state lives for the whole session, so a finished login must leave it ready for the next.
  it("signs in again after a completed login", async () => {
    account = { isConnected: true, address: "0xabc", connector: { id: "waap" } };
    const { result, rerender } = renderLoginFlow();

    await act(async () => {
      await result.current.signIn({ useWaap: true });
    });
    expect(connectDatastore).toHaveBeenCalledTimes(1);

    dbAccessTokenStatus = "connected";
    rerender();
    expect(navigateToPage).toHaveBeenCalledTimes(1);

    dbAccessTokenStatus = "idle";
    await act(async () => {
      await result.current.signIn({ useWaap: true });
    });
    expect(connectDatastore).toHaveBeenCalledTimes(2);
  });
});
