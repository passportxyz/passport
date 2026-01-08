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

// RS256 header: {"alg":"RS256","typ":"JWT"} -> eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9
// Payload with far future exp: {"exp":9999999999} -> eyJleHAiOjk5OTk5OTk5OTl9
const validRS256Token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(() => ({
      data: {
        nonce: "test-nonce-123",
      },
    })),
    post: vi.fn(() => ({
      data: {
        access: validRS256Token,
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
      access: validRS256Token,
    },
  })),
}));

// Mock wagmi hooks needed by DatastoreConnectionContextProvider
vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal()),
  useAccount: () => ({
    address: mockAddress,
    isConnected: true,
    chain: { id: 1 },
  }),
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

    it("should reuse existing valid RS256 JWT token when available", async () => {
      // Pre-populate localStorage with a valid RS256 token (expires far in the future)
      localStorage.setItem(`dbcache-token-${mockAddress}`, validRS256Token);

      renderTestComponent();

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("db-access-token-status").textContent).toContain("connected");
      });

      // Should NOT have called signMessage since we reused existing token
      expect(mockWalletClient.signMessage).not.toHaveBeenCalled();
      expect(screen.getByTestId("db-access-token").textContent).toBe(validRS256Token);
    });

    it("should reject old HS256 tokens and require new SIWE authentication", async () => {
      // Pre-populate localStorage with an old HS256 token (pre-SIWE migration)
      // HS256 header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
      const oldHS256Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature";
      localStorage.setItem(`dbcache-token-${mockAddress}`, oldHS256Token);

      renderTestComponent();

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByTestId("db-access-token-status").textContent).toContain("connected");
      });

      // Should have called signMessage because HS256 token was rejected
      expect(mockWalletClient.signMessage).toHaveBeenCalled();
      // Should have new RS256 token, not the old HS256 one
      expect(screen.getByTestId("db-access-token").textContent).toBe(validRS256Token);
      // Old token should be cleared from localStorage
      expect(localStorage.getItem(`dbcache-token-${mockAddress}`)).toBe(validRS256Token);
    });
  });
});
