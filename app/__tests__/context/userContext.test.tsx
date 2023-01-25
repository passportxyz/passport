import { render, waitFor, screen } from "@testing-library/react";
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
    render(
      <UserContextProvider>
        <CeramicContext.Provider value={mockCeramicContext}>
          <TestingComponent />
        </CeramicContext.Provider>
      </UserContextProvider>
    );
  });
});
