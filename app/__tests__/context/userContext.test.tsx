import { render, waitFor, screen } from "@testing-library/react";
import * as framework from "@self.id/framework";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { AccountId } from "caip";
import { useContext, useEffect, useState } from "react";
import { mockAddress, mockWallet } from "../../__test-fixtures__/onboardHookValues";
import { makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";

import { UserContext, UserContextProvider } from "../../context/userContext";
import { CeramicContext } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

jest.mock("@web3-onboard/react", () => ({
  useConnectWallet: () => [{ wallet: mockWallet }, () => Promise.resolve([mockWallet]), jest.fn()],
}));

jest.mock("@didtools/pkh-ethereum", () => {
  return {
    EthereumWebAuth: {
      getAuthMethod: jest.fn(),
    },
  };
});

jest.mock("did-session", () => {
  return {
    DIDSession: {
      authorize: () => ({
        serialize: jest.fn(),
      }),
    },
  };
});

jest.mock("@self.id/web", () => {
  return {
    EthereumAuthProvider: jest.fn(),
  };
});

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

const TestingComponent = () => {
  const { loggingIn, connect } = useContext(UserContext);
  const [session, setSession] = useState("");

  useEffect(() => {
    // using https://www.npmjs.com/package/jest-localstorage-mock to mock localStorage
    setSession(localStorage.getItem("didsession-0xmyAddress") ?? "");
  });

  return (
    <div>
      <div data-testid="session-id">{session}</div>
      <div>Logging In: {String(loggingIn)}</div>
      <button onClick={connect}>Connect</button>
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

describe("<UserContext>", () => {
  const renderTestComponent = () =>
    render(
      <UserContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </UserContextProvider>
    );

  beforeEach(() => {
    localStorage.setItem("connectedWallets", "[]");
  });

  it("should delete localStorage item if session has expired", async () => {
    const ceramicConnect = jest.fn().mockResolvedValueOnce({
      client: {
        session: {
          isExpired: true,
          expireInSecs: 3400,
        },
      },
    });
    (framework.useViewerConnection as jest.Mock).mockReturnValue([
      { status: "connecting", selfID: { did: "did:test" } },
      ceramicConnect,
      jest.fn(),
    ]);

    localStorage.setItem("didsession-0xmyAddress", "eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

    renderTestComponent();

    expect(screen.getByTestId("session-id")).toHaveTextContent("eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

    screen.getByRole("button").click();

    await waitFor(() => expect(screen.getByText("Logging In: false")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId("session-id").textContent).toBe(""));
  });

  describe("when using multichain", () => {
    beforeEach(async () => {
      const ceramicConnect = jest.fn().mockResolvedValueOnce({
        client: {},
      });
      (framework.useViewerConnection as jest.Mock).mockReturnValue([
        { status: "connecting" },
        ceramicConnect,
        jest.fn(),
      ]);
    });

    it("should use chain id 1 in the DID regardless of the wallet chain", async () => {
      renderTestComponent();

      screen.getByRole("button").click();

      await waitFor(() => expect(screen.getByText("Logging In: true")).toBeInTheDocument());

      await waitFor(() => expect(screen.getByText("Logging In: false")).toBeInTheDocument());

      expect(EthereumWebAuth.getAuthMethod as jest.Mock).toHaveBeenCalledWith(
        mockWallet.provider,
        new AccountId({ address: mockAddress, chainId: "eip155:1" })
      );
    });

    it("should create a DID with id 1 when switching to a different chain", async () => {
      localStorage.setItem("didsession-0xmyAddress", "eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

      renderTestComponent();

      screen.getByRole("button").click();

      await waitFor(() => expect(screen.getByText("Logging In: true")).toBeInTheDocument());

      await waitFor(() => expect(screen.getByText("Logging In: false")).toBeInTheDocument());

      expect(EthereumWebAuth.getAuthMethod as jest.Mock).toHaveBeenCalledWith(
        mockWallet.provider,
        new AccountId({ address: mockAddress, chainId: "eip155:1" })
      );
    });
  });
});
