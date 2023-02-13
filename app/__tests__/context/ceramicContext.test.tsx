import { render, waitFor, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { useContext, useState, useEffect } from "react";
import { CeramicContext, CeramicContextProvider } from "../../context/ceramicContext";
import { CeramicDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import {
  googleStampFixture,
  discordStampFixture,
  brightidStampFixture,
  facebookStampFixture,
} from "../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { UserContext, UserContextState } from "../../context/userContext";
import { act } from "react-dom/test-utils";

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

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

// jest.unmock("@gitcoin/passport-database-client");

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

export const dbGetPassportMock = jest.fn().mockImplementation(() => {
  return {
    passport: {
      stamps: [],
    },
    errorDetails: {},
    status: "Success",
  };
});
export const dbAddStampMock = jest.fn();
export const dbAddStampsMock = jest.fn();
export const dbDeleteStampMock = jest.fn();
export const dbDeleteStampsMock = jest.fn();
export const dbCreatePassportMock = jest.fn();

const stamps = [googleStampFixture, discordStampFixture, brightidStampFixture, facebookStampFixture].map((stamp) => {
  stamp.credential.expirationDate = "2099-05-15T21:04:01.708Z";
  stamp.credential.credentialSubject.id = "test-user-did";
  stamp.credential.issuer = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";
  return stamp;
});

describe("CeramicContextProvider syncs stamp state with ceramic", () => {
  beforeEach(() => {});

  // const passportDatabase = new PassportDatabase("", "", "");
  const ceramicDatabase = new CeramicDatabase(undefined);
  it("when adding new stamps", async () => {
    (PassportDatabase as jest.Mock).mockImplementation(() => {
      console.log("geri - my mock");
      return {
        createPassport: dbCreatePassportMock,
        getPassport: jest.fn().mockImplementation(async () => {
          console.log("geri PassportDatabase.getPassport");
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
        addStamp: dbAddStampMock,
        addStamps: dbAddStampsMock,
        deleteStamp: dbDeleteStampMock,
        deleteStamps: dbDeleteStampsMock,
        did: "test-user-did",
      };
    });
    (CeramicDatabase as jest.Mock).mockImplementation(() => {
      console.log("geri - my mock CeramicDatabase");
      return {
        createPassport: dbCreatePassportMock,
        getPassport: jest.fn().mockImplementation(async () => {
          console.log("geri CeramicDatabase.getPassport");
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
        addStamp: dbAddStampMock,
        addStamps: dbAddStampsMock,
        deleteStamp: dbDeleteStampMock,
        deleteStamps: dbDeleteStampsMock,
        did: "test-user-did",
      };
    });
    const TestingComponentDeleteStamps = () => {
      const { passport, handleDeleteStamps } = useContext(CeramicContext);

      // When passport was loaded, delete stamps
      useEffect(() => {
        console.log("GERI - mock", passport);
        (async () => {
          if (passport) {
            // await handleDeleteStamps([googleStampFixture.provider]);
          }
        })();
      }, [passport]);

      return (
        <>
          <div># Stamps = {passport && passport.stamps.length}</div>
        </>
      );
    };

    render(
      <UserContext.Provider value={mockUserContext}>
        <CeramicContextProvider>
          <TestingComponentDeleteStamps />
        </CeramicContextProvider>
      </UserContext.Provider>
    );

    await waitFor(() => expect(screen.getAllByText("# Stamps = 4")).toHaveLength(1));
  });
});
