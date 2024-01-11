import { render, waitFor, screen } from "@testing-library/react";
import * as framework from "@self.id/framework";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { AccountId } from "caip";
import { useEffect, useState } from "react";
import { mockAddress, mockWallet } from "../../__test-fixtures__/onboardHookValues";
import { makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";

import {
  DatastoreConnectionContextProvider,
  useDatastoreConnectionContext,
} from "../../context/datastoreConnectionContext";
import { CeramicContext } from "../../context/ceramicContext";
import { Eip1193Provider } from "ethers";

jest.mock("axios", () => ({
  get: () => ({
    data: {
      nonce: "123",
    },
  }),
  post: () => ({
    data: {
      access: "456",
    },
  }),
}));

jest.mock("@didtools/pkh-ethereum", () => {
  return {
    EthereumWebAuth: {
      getAuthMethod: jest.fn(),
    },
  };
});

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: () => ({
      p: {
        iss: "did:3:myDid",
      },
    }),
  },
}));

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
  const { connect, dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();
  const [session, setSession] = useState("");

  useEffect(() => {
    // using https://www.npmjs.com/package/jest-localstorage-mock to mock localStorage
    setSession(localStorage.getItem("didsession-0xmyAddress") ?? "");
  });

  return (
    <div>
      <div data-testid="session-id">{session}</div>
      <div data-testid="db-access-token-status">Status: {dbAccessTokenStatus}</div>
      <div data-testid="db-access-token">{dbAccessToken}</div>
      <button onClick={() => connect("0xmyAddress", jest.fn() as unknown as Eip1193Provider)}>Connect</button>
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
      <DatastoreConnectionContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </DatastoreConnectionContextProvider>
    );

  beforeEach(() => {
    localStorage.setItem("connectedWallets", "[]");
  });

  describe("when using multichain", () => {
    beforeEach(async () => {
      const ceramicConnect = jest.fn().mockResolvedValueOnce({
        did: {
          createDagJWS: () => ({
            jws: {
              link: {
                bytes: [1, 2, 3, 4],
              },
              payload: "test-payload",
              signatures: ["test-signature"],
            },
            cacaoBlock: "test-cacao-block",
          }),
        },
        client: {
          session: {
            serialize: () => "test-session",
          },
        },
      });
      (framework.useViewerConnection as jest.Mock).mockReturnValue([
        { status: "connecting" },
        ceramicConnect,
        jest.fn(),
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should use chain id 1 in the DID regardless of the wallet chain", async () => {
      renderTestComponent();

      screen.getByRole("button").click();

      await waitFor(() => expect(screen.getByText("Status: connected")).toBeInTheDocument());

      expect(EthereumWebAuth.getAuthMethod as jest.Mock).toHaveBeenCalledWith(
        expect.anything(),
        new AccountId({ address: mockAddress, chainId: "eip155:1" })
      );
    });

    it("should reuse existing DIDsession when applicable", async () => {
      localStorage.setItem("didsession-0xmyAddress", "eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

      renderTestComponent();

      screen.getByRole("button").click();

      await waitFor(() => expect(screen.getByText("Status: connected")).toBeInTheDocument());

      expect(EthereumWebAuth.getAuthMethod as jest.Mock).not.toHaveBeenCalled();
    });
  });
});
