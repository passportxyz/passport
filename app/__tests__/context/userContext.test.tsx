import { render, waitFor, screen } from "@testing-library/react";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import * as framework from "@self.id/framework";
import { useContext } from "react";
import { mockAddress, mockWallet } from "../../__test-fixtures__/onboardHookValues";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

import { UserContext, UserContextProvider, UserContextState } from "../../context/userContext";
import { CeramicContext, CeramicContextProvider } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

jest.mock("@web3-onboard/react", () => ({
  useConnectWallet: () => [{wallet: mockWallet}],
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
localStorageMock.setItem('didsession-0xmyAddress', "eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");

const TestingComponent = () => {
  const { wallet } = useContext(UserContext);
  return (
    <div>
      {wallet?.label}
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
  it("should not return a wallet if session has expired", () => {
    const mockSerialize = jest.fn().mockResolvedValue("eyJzZXNzaW9uS2V5U2VlZCI6IlF5cTN4aW9ubGxD...");
    const ceramicConnect = jest.fn().mockResolvedValueOnce({
      client: {
        session: {
          serialize: mockSerialize,
          isExpired: true,
          expireInSecs: 3500,
        },
      },
    });
    render(
      <UserContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </UserContextProvider>
    );
  });
});
