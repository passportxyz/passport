import { vi, describe, it, expect } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import {
  CeramicContext,
  CeramicContextProvider,
  CeramicContextState,
  cleanPassport,
  getStampsToRetry,
} from "../../context/ceramicContext";
import { ComposeDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import { useEffect } from "react";
import {
  googleStampFixture,
  discordStampFixture,
  brightidStampFixture,
} from "../../__test-fixtures__/databaseStorageFixtures";
import { PROVIDER_ID, Passport, Stamp } from "@gitcoin/passport-types";
import { DatastoreConnectionContext } from "../../context/datastoreConnectionContext";
import { DID } from "dids";
import { ChakraProvider } from "@chakra-ui/react";

process.env.NEXT_PUBLIC_FF_CERAMIC_CLIENT = "on";

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x123",
  }),
}));

const databasePassport: Passport = {
  issuanceDate: new Date("2024-04-16T18:43:50.550Z"),
  expiryDate: new Date("2024-07-15T18:43:50.550Z"),
  stamps: [
    {
      provider: "Google",
      credential: {
        "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
        type: ["VerifiableCredential"],
        credentialSubject: {
          "@context": {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
          id: "did:pkh:eip155:1:0x514E3B94F0287cAf77009039B72C321Ef5F016E6",
          hash: "v0.0.0:IrDUCNfjv2cbSx4QOCY9/Q4Igyj8A3EeqWVtbQcjSQI=",
          provider: "Google",
        },
        issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
        issuanceDate: "2024-04-16T18:43:50.550Z",
        expirationDate: "2024-07-15T18:43:50.550Z",
        proof: {
          "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
          type: "EthereumEip712Signature2021",
          proofPurpose: "assertionMethod",
          proofValue:
            "0x42c1c42d1a449feb17bbc0d0c668cd413b0361b8c549986219faf0885d31bab820db7be7f109da9db544e2db3bfe02dbc14c5e1e16c92bb031f3483a8d6a3bdb1b",
          verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
          created: "2024-04-16T18:43:50.551Z",
          eip712Domain: {
            domain: {
              name: "VerifiableCredential",
            },
            primaryType: "Document",
            types: {
              "@context": [
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              CredentialSubject: [
                {
                  name: "@context",
                  type: "@context",
                },
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "id",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              Document: [
                {
                  type: "string[]",
                  name: "@context",
                },
                {
                  type: "CredentialSubject",
                  name: "credentialSubject",
                },
                {
                  type: "string",
                  name: "expirationDate",
                },
                {
                  type: "string",
                  name: "issuanceDate",
                },
                {
                  type: "string",
                  name: "issuer",
                },
                {
                  type: "Proof",
                  name: "proof",
                },
                {
                  type: "string[]",
                  name: "type",
                },
              ],
              EIP712Domain: [
                {
                  name: "name",
                  type: "string",
                },
              ],
              Proof: [
                {
                  name: "@context",
                  type: "string",
                },
                {
                  name: "created",
                  type: "string",
                },
                {
                  name: "proofPurpose",
                  type: "string",
                },
                {
                  name: "type",
                  type: "string",
                },
                {
                  name: "verificationMethod",
                  type: "string",
                },
              ],
            },
          },
        },
      },
    },
    {
      provider: "Discord",
      credential: {
        "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
        type: ["VerifiableCredential"],
        credentialSubject: {
          "@context": {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
          id: "did:pkh:eip155:1:0x514E3B94F0287cAf77009039B72C321Ef5F016E6",
          hash: "v0.0.0:+9FUFRokjYGsZsAR1/klDERjzYfH+aVNiMdNhL8YSx4=",
          provider: "Discord",
        },
        issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
        issuanceDate: "2024-04-16T18:45:09.627Z",
        expirationDate: "2024-07-15T18:45:09.627Z",
        proof: {
          "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
          type: "EthereumEip712Signature2021",
          proofPurpose: "assertionMethod",
          proofValue:
            "0x7b970ed2394fc068b9b285319b16221d2e01929e2d4fb11dcc6de6e24aaef76306d9209e02b1a8bc2a991c6d82e691de905f6e7ae7ede15fbe09c8c5eff0afb01b",
          verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
          created: "2024-04-16T18:45:09.628Z",
          eip712Domain: {
            domain: {
              name: "VerifiableCredential",
            },
            primaryType: "Document",
            types: {
              "@context": [
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              CredentialSubject: [
                {
                  name: "@context",
                  type: "@context",
                },
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "id",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              Document: [
                {
                  type: "string[]",
                  name: "@context",
                },
                {
                  type: "CredentialSubject",
                  name: "credentialSubject",
                },
                {
                  type: "string",
                  name: "expirationDate",
                },
                {
                  type: "string",
                  name: "issuanceDate",
                },
                {
                  type: "string",
                  name: "issuer",
                },
                {
                  type: "Proof",
                  name: "proof",
                },
                {
                  type: "string[]",
                  name: "type",
                },
              ],
              EIP712Domain: [
                {
                  name: "name",
                  type: "string",
                },
              ],
              Proof: [
                {
                  name: "@context",
                  type: "string",
                },
                {
                  name: "created",
                  type: "string",
                },
                {
                  name: "proofPurpose",
                  type: "string",
                },
                {
                  name: "type",
                  type: "string",
                },
                {
                  name: "verificationMethod",
                  type: "string",
                },
              ],
            },
          },
        },
      },
    },
    {
      provider: "Linkedin",
      credential: {
        "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
        type: ["VerifiableCredential"],
        credentialSubject: {
          "@context": {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
          id: "did:pkh:eip155:1:0x514E3B94F0287cAf77009039B72C321Ef5F016E6",
          hash: "v0.0.0:SUhpZqSSs+5njNovwmu9qHn1Y6CiGhAaDw4WiFbidX8=",
          provider: "Linkedin",
        },
        issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
        issuanceDate: "2024-04-16T18:45:27.880Z",
        expirationDate: "2024-07-15T18:45:27.880Z",
        proof: {
          "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
          type: "EthereumEip712Signature2021",
          proofPurpose: "assertionMethod",
          proofValue:
            "0x176164c695194dc9ec0cdc5d87848a9b4ef27a4a78e1b2921d7d1baccc99a1dc45cbd1aac56b3aa2fc92f47d4eeca06f37628e8d7774a19fe88e33dec869cfbc1c",
          verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
          created: "2024-04-16T18:45:27.880Z",
          eip712Domain: {
            domain: {
              name: "VerifiableCredential",
            },
            primaryType: "Document",
            types: {
              "@context": [
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              CredentialSubject: [
                {
                  name: "@context",
                  type: "@context",
                },
                {
                  name: "hash",
                  type: "string",
                },
                {
                  name: "id",
                  type: "string",
                },
                {
                  name: "provider",
                  type: "string",
                },
              ],
              Document: [
                {
                  type: "string[]",
                  name: "@context",
                },
                {
                  type: "CredentialSubject",
                  name: "credentialSubject",
                },
                {
                  type: "string",
                  name: "expirationDate",
                },
                {
                  type: "string",
                  name: "issuanceDate",
                },
                {
                  type: "string",
                  name: "issuer",
                },
                {
                  type: "Proof",
                  name: "proof",
                },
                {
                  type: "string[]",
                  name: "type",
                },
              ],
              EIP712Domain: [
                {
                  name: "name",
                  type: "string",
                },
              ],
              Proof: [
                {
                  name: "@context",
                  type: "string",
                },
                {
                  name: "created",
                  type: "string",
                },
                {
                  name: "proofPurpose",
                  type: "string",
                },
                {
                  name: "type",
                  type: "string",
                },
                {
                  name: "verificationMethod",
                  type: "string",
                },
              ],
            },
          },
        },
      },
    },
  ],
};

const composeStamps: Stamp[] = [
  {
    provider: "Google",
    credential: {
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        "@context": {
          hash: "https://schema.org/Text",
          provider: "https://schema.org/Text",
        },
        id: "did:pkh:eip155:1:0x514E3B94F0287cAf77009039B72C321Ef5F016E6",
        hash: "v0.0.0:IrDUCNfjv2cbSx4QOCY9/Q4Igyj8A3EeqWVtbQcjSQI=",
        provider: "Google",
      },
      issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
      issuanceDate: "2024-04-16T18:43:50.550Z",
      expirationDate: "2024-07-15T18:43:50.550Z",
      proof: {
        "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
        type: "EthereumEip712Signature2021",
        proofPurpose: "assertionMethod",
        proofValue:
          "0x42c1c42d1a449feb17bbc0d0c668cd413b0361b8c549986219faf0885d31bab820db7be7f109da9db544e2db3bfe02dbc14c5e1e16c92bb031f3483a8d6a3bdb1b",
        verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
        created: "2024-04-16T18:43:50.551Z",
        eip712Domain: {
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
          types: {
            "@context": [
              {
                name: "hash",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "hash",
                type: "string",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                type: "string[]",
                name: "@context",
              },
              {
                type: "CredentialSubject",
                name: "credentialSubject",
              },
              {
                type: "string",
                name: "expirationDate",
              },
              {
                type: "string",
                name: "issuanceDate",
              },
              {
                type: "string",
                name: "issuer",
              },
              {
                type: "Proof",
                name: "proof",
              },
              {
                type: "string[]",
                name: "type",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
          },
        },
      },
    },
  },
  {
    provider: "Discord",
    credential: {
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        "@context": {
          hash: "https://schema.org/Text",
          provider: "https://schema.org/Text",
        },
        id: "did:pkh:eip155:1:0x514E3B94F0287cAf77009039B72C321Ef5F016E6",
        hash: "v0.0.0:+9FUFRokjYGsZsAR1/klDERjzYfH+aVNiMdNhL8YSx4=",
        provider: "Discord",
      },
      issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
      issuanceDate: "2024-04-16T18:45:09.627Z",
      expirationDate: "2024-07-15T18:45:09.627Z",
      proof: {
        "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
        type: "EthereumEip712Signature2021",
        proofPurpose: "assertionMethod",
        proofValue:
          "0x7b970ed2394fc068b9b285319b16221d2e01929e2d4fb11dcc6de6e24aaef76306d9209e02b1a8bc2a991c6d82e691de905f6e7ae7ede15fbe09c8c5eff0afb01b",
        verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
        created: "2024-04-16T18:45:09.628Z",
        eip712Domain: {
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
          types: {
            "@context": [
              {
                name: "hash",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "hash",
                type: "string",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                type: "string[]",
                name: "@context",
              },
              {
                type: "CredentialSubject",
                name: "credentialSubject",
              },
              {
                type: "string",
                name: "expirationDate",
              },
              {
                type: "string",
                name: "issuanceDate",
              },
              {
                type: "string",
                name: "issuer",
              },
              {
                type: "Proof",
                name: "proof",
              },
              {
                type: "string[]",
                name: "type",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
          },
        },
      },
    },
  },
];

export const dbGetPassportMock = vi.fn().mockImplementation(async () => {
  return {
    passport: {
      stamps: [],
    },
    errorDetails: {},
    status: "Success",
  };
});
export const dbAddStampMock = vi.fn();
export const dbAddStampsMock = vi.fn();
export const dbDeleteStampMock = vi.fn();
export const dbDeleteStampsMock = vi.fn();
export const dbCreatePassportMock = vi.fn();

const stamps = [googleStampFixture, discordStampFixture, brightidStampFixture].map((stamp) => {
  stamp.credential.expirationDate = "2099-05-15T21:04:01.708Z";
  stamp.credential.credentialSubject.id = "test-user-did";
  stamp.credential.issuer = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";
  stamp.credential.credentialSubject.provider = stamp.provider;
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
  getPassport: vi.fn(),
  addStamp: dbAddStampMock,
  addStamps: dbAddStampsMock,
  deleteStamp: dbDeleteStampMock,
  deleteStamps: dbDeleteStampsMock,
  did: "test-user-did",
};

const ceramicDbMocks = {
  createPassport: dbCreatePassportMock,
  getPassport: dbGetPassportMock,
  addStamp: dbAddStampMock,
  addStamps: dbAddStampsMock,
  deleteStamp: dbDeleteStampMock,
  deleteStamps: dbDeleteStampsMock,
  patchStamps: vi.fn(),
  did: "test-user-did",
};

vi.mock("@gitcoin/passport-database-client", () => {
  return {
    ComposeDatabase: vi.fn().mockImplementation(() => ceramicDbMocks),
    PassportDatabase: vi.fn().mockImplementation(() => passportDbMocks),
  };
});

const mockComponent = ({ invalidSession }: { invalidSession?: boolean } = {}) => (
  <ChakraProvider>
    <DatastoreConnectionContext.Provider
      value={{
        dbAccessToken: "token",
        dbAccessTokenStatus: "idle",
        did: {
          id: "did:3:abc",
          parent: "did:3:abc",
        } as unknown as DID,
        connect: async () => {},
        disconnect: async () => {},
        checkSessionIsValid: () => !invalidSession,
      }}
    >
      <CeramicContextProvider>
        <CeramicContext.Consumer>
          {(value: CeramicContextState) => {
            return (
              <>
                <div># Stamps = {value.passport && value.passport.stamps.length}</div>
                <div>Expired providers: {value.expiredProviders.join(",")}</div>
                <div onClick={() => value.handleAddStamps(stamps)}>handleAddStamps</div>
                <div onClick={() => value.handleDeleteStamps(stampProviderIds)}>handleDeleteStamps</div>
                <div onClick={() => value.handlePatchStamps(stampPatches)}>handlePatchStamps</div>
              </>
            );
          }}
        </CeramicContext.Consumer>
      </CeramicContextProvider>
    </DatastoreConnectionContext.Provider>
  </ChakraProvider>
);

describe("CeramicContextProvider", () => {
  it("calls handleComposeRetry on useEffect trigger", async () => {
    // spy on handleComposeRetry
    const handleComposeRetry = vi.fn();

    vi.mocked(PassportDatabase).mockImplementation(() => {
      return {
        ...passportDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: databasePassport,
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });
    vi.mocked(ComposeDatabase).mockImplementation(() => {
      return {
        ...ceramicDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps: composeStamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });

    const Component = () => {
      useEffect(() => {
        handleComposeRetry(composeStamps, databasePassport);
      }, []);
      return <></>;
    };
    // Render the component
    render(
      <ChakraProvider>
        <DatastoreConnectionContext.Provider
          value={{
            dbAccessToken: "token",
            dbAccessTokenStatus: "idle",
            did: {
              id: "did:3:abc",
              parent: "did:3:abc",
            } as unknown as DID,
            connect: async () => {},
            disconnect: async () => {},
          }}
        >
          <CeramicContextProvider>
            <Component />
          </CeramicContextProvider>
        </DatastoreConnectionContext.Provider>
      </ChakraProvider>
    );
    // Wait for the useEffect to trigger
    await waitFor(() => expect(handleComposeRetry).toHaveBeenCalledTimes(1));
  });
});

describe("CeramicContextProvider syncs stamp state with ceramic", () => {
  beforeEach(() => {
    vi.mocked(ComposeDatabase).mockImplementation(() => ceramicDbMocks as any);
  });

  it("should return passport and stamps after successful fetch", async () => {
    vi.mocked(PassportDatabase).mockImplementation(() => {
      return {
        ...passportDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 3")).toHaveLength(1));
  });
  it("should clean a dirty passport after successful fetch", async () => {
    const expiredStamp = {
      ...googleStampFixture,
      credential: { ...googleStampFixture.credential, expirationDate: "2021-05-15T21:04:01.708Z" },
    };
    vi.mocked(PassportDatabase).mockImplementation(() => {
      return {
        ...passportDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps: [...stamps, expiredStamp],
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 4")).toHaveLength(1));
    await waitFor(() => expect(screen.getAllByText("Expired providers: Google")).toHaveLength(1));
  });

  it("should set passport to undefined if an exception is raised while fetching", async () => {
    vi.mocked(PassportDatabase).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: {},
            errorDetails: {},
            status: "ExceptionRaised",
          };
        }),
      } as any;
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps =")).toHaveLength(1));
  });
  it("should attempt to create ceramic passport if passport from passport db DoesNotExist", async () => {
    vi.mocked(PassportDatabase).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        getPassport: vi
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
      } as any;
    });
    vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
      return {
        ...ceramicDbMocks,
        getPassport: vi.fn().mockImplementation(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });
    render(mockComponent());

    await waitFor(() => expect(screen.getAllByText("# Stamps = 3")).toHaveLength(1));
  });

  it("should attempt to add stamps to database and ceramic", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = vi.fn();

      const addStampsMock = vi.fn();
      const addStampMock = vi.fn().mockRejectedValue(new Error("Error"));
      vi.mocked(PassportDatabase).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          addStamps: addStampsMock.mockImplementationOnce(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          getPassport: vi.fn().mockImplementationOnce(async () => {
            return {
              passport: {
                stamps: [],
              },
              errorDetails: {},
              status: "Success",
            };
          }),
        } as any;
      });
      vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          getPassport: vi.fn().mockImplementation(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          addStamps: addStampMock,
        } as any;
      });
      render(mockComponent());

      await waitFor(() => fireEvent.click(screen.getByText("handleAddStamps")));
      await waitFor(() => {
        expect(addStampsMock).toHaveBeenCalled();
        expect(addStampMock).toHaveBeenCalledWith(stamps);
        expect(console.log).toHaveBeenCalledWith("error adding ceramic stamps", new Error("Error"));
      });
    } finally {
      console.log = oldConsoleLog;
    }
  });
  it("should attempt to delete stamps from database and ceramic", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = vi.fn();
      const deleteStampsMock = vi.fn().mockRejectedValue("Error");
      vi.mocked(PassportDatabase).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          deleteStamps: deleteStampsMock.mockImplementationOnce(async () => {
            return {
              passport: {
                stamps: [],
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          getPassport: vi.fn().mockImplementationOnce(async () => {
            return {
              passport: {
                stamps: [],
              },
              errorDetails: {},
              status: "Success",
            };
          }),
        } as any;
      });
      vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          deleteStamps: deleteStampsMock,
        } as any;
      });
      render(mockComponent());

      await waitFor(() => fireEvent.click(screen.getByText("handleDeleteStamps")));
      await waitFor(() => {
        expect(deleteStampsMock).toHaveBeenCalled();
        expect(deleteStampsMock).toHaveBeenCalledWith(stamps.map((stamp) => stamp.provider));
      });
    } finally {
      console.log = oldConsoleLog;
    }
  });

  it("should patch stamps in database and delete + add stamps in ceramic", async () => {
    const added = stampPatches.filter(({ credential }) => credential);

    const patchStampsMock = vi.fn();
    vi.mocked(PassportDatabase).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        patchStamps: patchStampsMock.mockImplementationOnce(async () => {
          return {
            passport: {
              stamps: added,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
        getPassport: vi.fn().mockImplementationOnce(async () => {
          return {
            passport: {
              stamps: added,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });

    const setStampMock = vi.fn();
    const deleteStampsMock = vi.fn();

    vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
      return {
        ...ceramicDbMocks,
        deleteStampIDs: deleteStampsMock,
      } as any;
    });

    render(mockComponent());

    await waitFor(() => fireEvent.click(screen.getByText("handlePatchStamps")));
    await waitFor(() => {
      expect(patchStampsMock).toHaveBeenCalledWith(stampPatches);
    });
  });

  it("should log an error but continue if ceramic patch fails", async () => {
    const oldConsoleLog = console.log;
    try {
      console.log = vi.fn();

      const patchStampsMock = vi.fn().mockRejectedValue(new Error("Error"));
      vi.mocked(PassportDatabase).mockImplementationOnce(() => {
        return {
          ...passportDbMocks,
          patchStamps: patchStampsMock.mockImplementationOnce(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
          getPassport: vi.fn().mockImplementationOnce(async () => {
            return {
              passport: {
                stamps,
              },
              errorDetails: {},
              status: "Success",
            };
          }),
        } as any;
      });

      const setStampMock = vi.fn().mockRejectedValue(new Error("Error"));
      const deleteStampsMock = vi.fn();

      vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
        return {
          ...ceramicDbMocks,
          setStamps: setStampMock,
          deleteStampIDs: deleteStampsMock,
          patchStamps: patchStampsMock,
        } as any;
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

  it("should show an error toast but continue if ceramic patch fails due to invalid session", async () => {
    vi.mocked(PassportDatabase).mockImplementationOnce(() => {
      return {
        ...passportDbMocks,
        patchStamps: patchStampsMock.mockImplementationOnce(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
        getPassport: vi.fn().mockImplementationOnce(async () => {
          return {
            passport: {
              stamps,
            },
            errorDetails: {},
            status: "Success",
          };
        }),
      } as any;
    });

    const patchStampsMock = vi.fn();

    vi.mocked(ComposeDatabase).mockImplementationOnce(() => {
      return {
        ...ceramicDbMocks,
        patchStamps: patchStampsMock,
      } as any;
    });

    render(mockComponent({ invalidSession: true }));

    await waitFor(() => fireEvent.click(screen.getByText("handlePatchStamps")));
    await waitFor(() => expect(patchStampsMock).toHaveBeenCalledWith(stampPatches));
    await screen.findByText(
      "Your update was not logged to Ceramic. Please refresh the page to reset your Ceramic session."
    );
  });
});

const userDid = "test-user-did";
const mockDatabase = {
  did: userDid,
} as PassportDatabase;

const mockValidProviders = ["Google", "ENS"] as PROVIDER_ID[];

describe("cleanPassport function", () => {
  it("keeps expired stamps and records expired providers", () => {
    const expiredStamp = {
      credential: {
        expirationDate: "2000-05-15T21:04:01.708Z",
        credentialSubject: { provider: "Google", id: "test-user-did" },
        issuer: process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "",
      },
    };

    const passport = { stamps: [expiredStamp] } as Passport;
    const result = cleanPassport(passport, mockDatabase, mockValidProviders);
    expect(result.passport.stamps).toHaveLength(1);
    expect(result.expiredProviders).toContain("Google");
  });

  it("keeps valid stamps", () => {
    const validStamp = {
      credential: {
        expirationDate: "2099-05-15T21:04:01.708Z",
        credentialSubject: { provider: "Google", id: "test-user-did" },
        issuer: process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "",
      },
    };

    const passport = { stamps: [validStamp] } as Passport;
    const result = cleanPassport(passport, mockDatabase, mockValidProviders);
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
    const result = cleanPassport(passport, mockDatabase, mockValidProviders);
    expect(result.passport.stamps.length).toBe(0);
    expect(result.expiredProviders.length).toBe(0);
  });
});

describe("handleComposeRetry function", () => {
  it("should detect a difference between the stamps in the database and the stamps in ceramic", async () => {
    const result = getStampsToRetry(composeStamps, databasePassport.stamps);
    expect(result).toHaveLength(2);
  });
  it("should not return anything if the stamps in the database and the stamps in ceramic are the same", async () => {
    const result = getStampsToRetry(databasePassport.stamps, databasePassport.stamps);
    expect(result).toHaveLength(0);
  });
});
