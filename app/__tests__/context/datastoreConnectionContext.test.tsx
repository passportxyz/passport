import { vi, describe, it, expect, Mock } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { useEffect, useState } from "react";
import { makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";

import {
  DatastoreConnectionContextProvider,
  useDatastoreConnectionContext,
} from "../../context/datastoreConnectionContext";
import { CeramicContext } from "../../context/ceramicContext";
import { WalletClient } from "viem";

const mockAddress = "0xfF7edbD01e9d044486781ff52EA7a01612644";

// Mock SIWE
vi.mock("siwe", () => {
  return {
    SiweMessage: vi.fn().mockImplementation((config) => ({
      domain: config.domain,
      address: config.address,
      statement: config.statement,
      uri: config.uri,
      version: config.version,
      chainId: config.chainId,
      nonce: config.nonce,
      issuedAt: config.issuedAt || new Date().toISOString(),
      prepareMessage: () => "Sign in to Human Passport with your wallet",
    })),
  };
});

vi.mock("axios", () => ({
  default: {
    get: vi.fn(() => ({
      data: {
        nonce: "test-nonce-123",
      },
    })),
    post: vi.fn(() => ({
      data: {
        access: "test-jwt-token.eyJleHAiOjk5OTk5OTk5OTl9.signature",
      },
    })),
  },
  get: vi.fn(() => ({
    data: {
      nonce: "test-nonce-123",
    },
  })),
  post: vi.fn(() => ({
    data: {
      access: "test-jwt-token.eyJleHAiOjk5OTk5OTk5OTl9.signature",
    },
  })),
}));

vi.mock("../../context/walletStore", () => {
  return {
    useWalletStore: () => ({
      chain: "eip155:1",
      disconnect: vi.fn(),
    }),
  };
});

const mockWalletClient = {
  signMessage: vi.fn(() => Promise.resolve("0xmocksignature")),
} as unknown as WalletClient;

const TestingComponent = () => {
  const { connect, dbAccessTokenStatus, dbAccessToken, userAddress } = useDatastoreConnectionContext();
  const [session, setSession] = useState("");

  useEffect(() => {
    // using https://www.npmjs.com/package/vitest-localstorage-mock to mock localStorage
    setSession(localStorage.getItem(`dbcache-token-${mockAddress}`) ?? "");
  });

  return (
    <div>
      <div data-testid="session-id">{session}</div>
      <div data-testid="db-access-token-status">Status: {dbAccessTokenStatus}</div>
      <div data-testid="db-access-token">{dbAccessToken}</div>
      <div data-testid="user-address">{userAddress}</div>
      <button onClick={() => connect(mockAddress, mockWalletClient)}>Connect</button>
    </div>
  );
};

const mockCeramicContext = makeTestCeramicContext({
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
});

describe("<DatastoreConnectionContext>", () => {
  const renderTestComponent = () =>
    render(
      <DatastoreConnectionContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </DatastoreConnectionContextProvider>
    );

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("SIWE authentication", () => {
    it("should authenticate using SIWE and store token", async () => {
      renderTestComponent();

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("db-access-token-status").textContent).toContain("connected");
      });

      expect(screen.getByTestId("user-address").textContent).toBe(mockAddress);
      expect(mockWalletClient.signMessage).toHaveBeenCalled();
    });

    it("should reuse existing valid JWT token when available", async () => {
      // Pre-populate localStorage with a valid token (expires far in the future)
      const validToken = "header.eyJleHAiOjk5OTk5OTk5OTl9.signature";
      localStorage.setItem(`dbcache-token-${mockAddress}`, validToken);

      renderTestComponent();

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("db-access-token-status").textContent).toContain("connected");
      });

      // Should NOT have called signMessage since we reused existing token
      expect(mockWalletClient.signMessage).not.toHaveBeenCalled();
      expect(screen.getByTestId("db-access-token").textContent).toBe(validToken);
    });
  });
});
