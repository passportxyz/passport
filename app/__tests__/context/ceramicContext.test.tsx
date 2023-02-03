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
        <p key={provider}>{provider}</p>
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
            stamps: [SUCCESFUL_ENS_RESULT],
          },
          status: "Success",
        }),
        checkPassportCACAOError: jest.fn().mockReturnValue(false),
      };
    }),
  };
});

// TODO: remove skip
describe.skip("<CeramicContextProvider>", () => {
  it("returns expired stamps PROVIDER_IDS", async () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <CeramicContextProvider>
          <TestingComponent />
        </CeramicContextProvider>
      </UserContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(SUCCESFUL_POAP_RESULT?.credential?.credentialSubject.provider || "")).toHaveLength(1);
    });
  });
});
