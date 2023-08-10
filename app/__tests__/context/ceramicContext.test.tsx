import { render, waitFor, screen, waitForElementToBeRemoved, fireEvent } from "@testing-library/react";
import { useContext, useState, useEffect } from "react";
import {
  AllProvidersState,
  CeramicContext,
  CeramicContextProvider,
  CeramicContextState,
  cleanPassport,
} from "../../context/ceramicContext";
import { CeramicDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import {
  googleStampFixture,
  discordStampFixture,
  brightidStampFixture,
  facebookStampFixture,
} from "../../__test-fixtures__/databaseStorageFixtures";
import { makeTestUserContext } from "../../__test-fixtures__/contextTestHelpers";
import { UserContext, UserContextState } from "../../context/userContext";
import { Passport } from "@gitcoin/passport-types";

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

const stampPatches = stamps.map(({ credential, provider }, index) => {
  if (index % 2 === 0) {
    return { provider };
  } else {
    return { credential, provider };
  }
});

const stampProviderIds = stamps.map((stamp) => stamp.provider);

const passportDbMocks = {
  createPassport: dbCreatePassportMock,
  getPassport: jest.fn(),
  addStamp: dbAddStampMock,
  addStamps: dbAddStampsMock,
  deleteStamp: dbDeleteStampMock,
  deleteStamps: dbDeleteStampsMock,
  did: "test-user-did",
};

const ceramicDbMocks = {
  createPassport: dbCreatePassportMock,
  getPassport: jest.fn(),
  addStamp: dbAddStampMock,
  addStamps: dbAddStampsMock,
  deleteStamp: dbDeleteStampMock,
  deleteStamps: dbDeleteStampsMock,
  did: "test-user-did",
};

const mockComponent = () => (
  <UserContext.Provider value={mockUserContext}>
    <CeramicContextProvider>
      <CeramicContext.Consumer>
        {(value: CeramicContextState) => {
          return (
            <>
              <div># Stamps = {value.passport && value.passport.stamps.length}</div>
              <div onClick={() => value.handleAddStamps(stamps)}>handleAddStamps</div>
              <div onClick={() => value.handleDeleteStamps(stampProviderIds)}>handleDeleteStamps</div>
              <div onClick={() => value.handlePatchStamps(stampPatches)}>handlePatchStamps</div>
            </>
          );
        }}
      </CeramicContext.Consumer>
    </CeramicContextProvider>
  </UserContext.Provider>
);

describe("CeramicContextProvider syncs stamp state with ceramic", () => {
  beforeEach(() => {
    (CeramicDatabase as jest.Mock).mockImplementation(() => ceramicDbMocks);
  });

  it("should return passport and stamps after successful fetch", async () => {
    (PassportDatabase as jest.Mock).mockImplementation(() => {
      return {
        ...passportDbMocks,
        getPassport: jest.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      };
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 4")).toHaveLength(1));
  });
  it("should clean a dirty passport after successful fetch", async () => {
    const expiredStamp = {
      ...facebookStampFixture,
      credential: { ...facebookStampFixture.credential, expirationDate: "2021-05-15T21:04:01.708Z" },
    };
    (PassportDatabase as jest.Mock).mockImplementation(() => {
      return {
        ...passportDbMocks,
        getPassport: jest.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps: [...stamps, expiredStamp],
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      };
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 4")).toHaveLength(1));
  });
  it("should set passport to undefined if an exception is raised while fetching", async () => {
    (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        getPassport: jest.fn().mockImplementation(async () => {
          return {
            passport: {},
            errorDetails: {},
            status: "ExceptionRaised",
          };
        }),
      };
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps =")).toHaveLength(1));
  });
  it("should attempt to create ceramic passport if passport from passport db DoesNotExist", async () => {
    (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        getPassport: jest
          .fn()
          .mockImplementationOnce(async () => {
            return {
              passport: {},
              errorDetails: {},
              status: "DoesNotExist",
            };
          })
          .mockImplementationOnce(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
      };
    });
    (CeramicDatabase as jest.Mock).mockImplementationOnce(() => {
      return {
        ...ceramicDbMocks,
        getPassport: jest.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      };
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 4")).toHaveLength(1));
  });

  it("should attempt to add stamps to database and ceramic", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = jest.fn();

      const addStampsMock = jest.fn();
      const setStampMock = jest.fn().mockRejectedValue(new Error("Error"));
      (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          addStamps: addStampsMock,
          getPassport: jest
            .fn()
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps: [],
                },
                errorDetails: {},
                status: "Success",
              };
            })
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps,
                },
                errorDetails: {},
                status: "Success",
              };
            }),
          setStamps: setStampMock,
        };
      });
      (CeramicDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          getPassport: jest.fn().mockImplementation(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          setStamps: setStampMock,
        };
      });
      render(mockComponent());

      await waitFor(() => fireEvent.click(screen.getByText("handleAddStamps")));
      await waitFor(() => {
        expect(addStampsMock).toHaveBeenCalled();
        expect(setStampMock).toHaveBeenCalledWith(stamps);
        expect(console.log).toHaveBeenCalledWith("error setting ceramic stamps", new Error("Error"));
      });
    } finally {
      console.log = oldConsoleLog;
    }
  });
  it("should attempt to delete stamps from database and ceramic", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = jest.fn();
      const deleteStampsMock = jest.fn();
      const setStampMock = jest.fn().mockRejectedValue(new Error("Error"));
      (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          deleteStamps: deleteStampsMock,
          getPassport: jest
            .fn()
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps,
                },
                errorDetails: {},
                status: "Success",
              };
            })
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps: [],
                },
                errorDetails: {},
                status: "Success",
              };
            }),
        };
      });
      (CeramicDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          getPassport: jest.fn().mockImplementation(async () => {
            return {
              passport: {
                stamps: [],
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          setStamps: setStampMock,
        };
      });
      render(mockComponent());

      await waitFor(() => fireEvent.click(screen.getByText("handleDeleteStamps")));
      await waitFor(() => {
        expect(deleteStampsMock).toHaveBeenCalled();
        expect(setStampMock).toHaveBeenCalledWith([]);
      });
    } finally {
      console.log = oldConsoleLog;
    }
  });

  it("should patch stamps in database and delete + add stamps in ceramic", async () => {
    const added = stampPatches.filter(({ credential }) => credential);
    const deletedProviders = stampPatches.filter(({ credential }) => !credential).map(({ provider }) => provider);

    const patchStampsMock = jest.fn();
    (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        patchStamps: patchStampsMock,
        getPassport: jest
          .fn()
          .mockImplementationOnce(async () => {
            return {
              passport: {
                stamps: [],
              },
              errorDetails: {},
              status: "Success",
            };
          })
          .mockImplementationOnce(async () => {
            return {
              passport: {
                stamps: added,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
      };
    });

    const setStampMock = jest.fn();
    const deleteStampsMock = jest.fn();

    (CeramicDatabase as jest.Mock).mockImplementationOnce(() => {
      return {
        ...ceramicDbMocks,
        setStamps: setStampMock,
        deleteStampIDs: deleteStampsMock,
      };
    });

    render(mockComponent());

    await waitFor(() => fireEvent.click(screen.getByText("handlePatchStamps")));
    await waitFor(() => {
      expect(patchStampsMock).toHaveBeenCalledWith(stampPatches);
      expect(deleteStampsMock).toHaveBeenCalledWith(deletedProviders);
      expect(setStampMock).toHaveBeenCalledWith(added);
    });
  });

  it("should log an error but continue if ceramic patch fails", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = jest.fn();

      const patchStampsMock = jest.fn();
      (PassportDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          patchStamps: patchStampsMock,
          getPassport: jest
            .fn()
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps: [],
                },
                errorDetails: {},
                status: "Success",
              };
            })
            .mockImplementationOnce(async () => {
              return {
                passport: {
                  stamps,
                },
                errorDetails: {},
                status: "Success",
              };
            }),
        };
      });

      const setStampMock = jest.fn().mockRejectedValue(new Error("Error"));
      const deleteStampsMock = jest.fn();

      (CeramicDatabase as jest.Mock).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          setStamps: setStampMock,
          deleteStampIDs: deleteStampsMock,
        };
      });

      render(mockComponent());

      await waitFor(() => fireEvent.click(screen.getByText("handlePatchStamps")));
      await waitFor(() => {
        expect(patchStampsMock).toHaveBeenCalledWith(stampPatches);
        expect(console.log).toHaveBeenCalledWith("error patching ceramic stamps", new Error("Error"));
      });
    } finally {
      console.log = oldConsoleLog;
    }
  });
});

const userDid = "test-user-did";
const mockDatabase = {
  did: userDid,
} as PassportDatabase;
const mockProvidersState = {
  google: true,
  facebook: true,
} as AllProvidersState;

describe("cleanPassport function", () => {
  it("removes expired stamps", () => {
    const expiredStamp = {
      credential: {
        expirationDate: "2000-05-15T21:04:01.708Z",
        credentialSubject: { provider: "google", id: "test-user-did" },
        issuer: process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "",
      },
    };

    const passport = { stamps: [expiredStamp] } as Passport;
    const result = cleanPassport(passport, mockDatabase, mockProvidersState);
    expect(result.passport.stamps).toHaveLength(0);
    expect(result.expiredProviders).toContain("google");
  });

  it("keeps valid stamps", () => {
    const validStamp = {
      credential: {
        expirationDate: "2099-05-15T21:04:01.708Z",
        credentialSubject: { provider: "facebook", id: "test-user-did" },
        issuer: process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "",
      },
    };

    const passport = { stamps: [validStamp] } as Passport;
    const result = cleanPassport(passport, mockDatabase, mockProvidersState);
    expect(result.passport.stamps.length).toBe(1);
    expect(result.expiredProviders.length).toBe(0);
  });
  it("filters out stamps that aren't in the providers state", () => {
    const validStamp = {
      credential: {
        expirationDate: "2099-05-15T21:04:01.708Z",
        credentialSubject: { provider: "poap", id: "test-user-did" },
        issuer: process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "",
      },
    };

    const passport = { stamps: [validStamp] } as Passport;
    const result = cleanPassport(passport, mockDatabase, mockProvidersState);
    expect(result.passport.stamps.length).toBe(0);
    expect(result.expiredProviders.length).toBe(0);
  });
});
