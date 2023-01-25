import { render, waitFor, screen } from "@testing-library/react";
import { useContext } from "react";
import { CeramicContext, CeramicContextProvider } from "../../context/ceramicContext";
import { CeramicDatabase } from "@gitcoin/passport-database-client";
import { SUCCESFUL_POAP_RESULT, SUCCESFUL_ENS_RESULT } from "../../__test-fixtures__/verifiableCredentialResults";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { UserContext, UserContextState } from "../../context/userContext";

const mockUserContext: UserContextState = makeTestUserContext();

const viewerConnection = {
  status: "connected",
  selfID: "did:3:abc",
};

jest.mock("../../utils/onboard.ts");

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: () => [viewerConnection],
  };
});

const TestingComponent = () => {
  const { expiredProviders } = useContext(CeramicContext);
  return (
    <div>
      {expiredProviders.map((provider) => (
        <div key={provider}>{provider}</div>
      ))}
    </div>
  );
};

jest.mock("@gitcoin/passport-database-client", () => {
  return {
    CeramicDatabase: jest.fn().mockImplementation(() => {
      return {
        getPassport: jest.fn().mockReturnValue({
          passport: {
            stamps: [SUCCESFUL_POAP_RESULT, SUCCESFUL_ENS_RESULT],
          },
        }),
        checkPassportCACAOError: jest.fn().mockReturnValue(false),
      };
    }),
  };
});

describe("<CeramicContextProvider>", () => {
  it("returns expired stamps PROVIDER_IDS", async () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <CeramicContextProvider>
          <TestingComponent />
        </CeramicContextProvider>
      </UserContext.Provider>
    );
    await waitFor(() => {
      expect(screen.getByText(SUCCESFUL_POAP_RESULT?.credential?.credentialSubject.provider || "")).toBeInTheDocument();
    });
  });
});
