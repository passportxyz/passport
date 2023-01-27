import { render, waitFor } from "@testing-library/react";
import * as framework from "@self.id/framework";
import { useContext } from "react";
import { mockWallet } from "../../__test-fixtures__/onboardHookValues";
import { makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";

import { UserContext, UserContextProvider } from "../../context/userContext";
import { CeramicContext } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

jest.mock("@web3-onboard/react", () => ({
  useConnectWallet: () => [{ wallet: mockWallet }, jest.fn(), jest.fn()],
}));

jest.mock("@didtools/pkh-ethereum", () => {
  return {
    EthereumWebAuth: {
      getAuthMethod: jest.fn(),
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

const localStorageMock = (function () {
  let store: any = {};

  return {
    getItem(key: any) {
      return store[key];
    },

    setItem(key: any, value: any) {
      store[key] = value;
    },

    clear() {
      store = {};
    },

    removeItem(key: any) {
      delete store[key];
    },

    getAll() {
      return store;
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const TestingComponent = () => {
  const { wallet } = useContext(UserContext);
  return <div>{wallet?.label}</div>;
};

const mockCeramicContext = makeTestCeramicContext({
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
});

jest.useRealTimers();

describe("<UserContext>", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("should delete localStorage item if session has expired", async () => {
    jest.useFakeTimers("legacy");

    const ceramicConnect = jest.fn().mockResolvedValueOnce({
      client: {
        session: {
          isExpired: true,
          expireInSecs: 3500,
        },
      },
    });
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connected" }, ceramicConnect, jest.fn()]);

    localStorageMock.setItem("didsession-0xmyAddress", "eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

    render(
      <UserContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </UserContextProvider>
    );

    await waitFor(() => expect(localStorageMock.getItem("didsession-0xmyAddress")).toBe(undefined), {
      timeout: 30000,
    });
  }, 30000);
});
