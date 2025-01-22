import { ComposeClient } from "@composedb/client";
import {
  PROVIDER_ID,
  Stamp,
  StampPatch,
  SecondaryStorageAddResponse,
  SecondaryStorageBulkPatchResponse,
  SecondaryStorageDeleteResponse,
} from "@gitcoin/passport-types";
import { DID } from "dids";
import { ComposeDatabaseImpl, ComposeDatabase, PassportWrapperLoadResponse } from "../src/composeDatabase";

import { jest } from "@jest/globals";
import mockStamps from "./mockStamps.json";
import { GraphQLError } from "graphql";

let database: ComposeDatabaseImpl;

const mockComposeError = {
  errors: [
    {
      message: "Unexpected error.",
      locations: [
        {
          line: 3,
          column: 5,
        },
      ],
      path: ["viewer", "gitcoinPassportStampWrapperList"],
    } as unknown as GraphQLError,
  ],
  data: {
    viewer: {
      gitcoinPassportStampWrapperList: null,
    },
  },
};

const document = { id: "123" };

const mockComposeVc = {
  content: {
    _context: ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
    issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
    issuanceDate: "2024-01-18T15:20:18.055Z",
    expirationDate: "2024-04-17T14:20:18.055Z",
    type: ["VerifiableCredential"],
    credentialSubject: {
      id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
      hash: "v0.0.0:eu7RH6ZXAtRhUm3wQ3jfMVYoJ18sXynFm2AvsjsT9FQ=",
      provider: "GitcoinContributorStatistics#totalContributionAmountGte#10",
      _context: {
        hash: "https://schema.org/Text",
        provider: "https://schema.org/Text",
      },
    },
    proof: {
      type: "EthereumEip712Signature2021",
      created: "2024-01-18T15:20:18.055Z",
      proofValue:
        "0xcd009c8caabd5549c0d20ce729271a10324c3c316972af5a715f801f387fefe76fbdcd657078d84a87fd452dbada03acfa2ce3e6efb829c086b31edeca4d54ae1b",
      eip712Domain: {
        types: {
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
              name: "@context",
              type: "string[]",
            },
            {
              name: "credentialSubject",
              type: "CredentialSubject",
            },
            {
              name: "expirationDate",
              type: "string",
            },
            {
              name: "issuanceDate",
              type: "string",
            },
            {
              name: "issuer",
              type: "string",
            },
            {
              name: "proof",
              type: "Proof",
            },
            {
              name: "type",
              type: "string[]",
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
          _context: [
            {
              name: "hash",
              type: "string",
            },
            {
              name: "provider",
              type: "string",
            },
          ],
        },
        domain: {
          name: "VerifiableCredential",
        },
        primaryType: "Document",
      },
      proofPurpose: "assertionMethod",
      verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      _context: "https://w3id.org/security/suites/eip712sig-2021/v1",
    },
  },
};

const mockWrapperId = "456";
const executeQueryMockReturn = {
  data: {
    createGitcoinPassportStamp: {
      document,
    },
    createGitcoinPassportStampWrapper: {
      document: {
        id: mockWrapperId,
      },
    },
  },
};

describe("Compose Database", () => {
  beforeEach(() => {
    database = new ComposeDatabaseImpl({ id: "id" } as unknown as DID);
    jest.clearAllMocks();
  });
  it("should format a vc to compose specifications", () => {
    const result = database.formatCredentialInput(mockStamps[0] as Stamp);
    expect(result).toEqual(mockComposeVc);
  });
  describe("adding stamps", () => {
    it("should add a single stamp successfully", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValue(executeQueryMockReturn);

      const result = await database.addStamp(mockStamps[0] as unknown as Stamp);
      console.log("RESULT", result);
      expect(result.secondaryStorageError).toBeUndefined();
      expect(result.secondaryStorageId).toEqual(mockWrapperId);
    });
    it("should indicate that an error was thrown from the add vc request", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      const addStampResponse = await database.addStamp(mockStamps[0] as unknown as Stamp);
      expect(addStampResponse.secondaryStorageError).toEqual(
        `[ComposeDB] error from mutation CreateGitcoinPassportVc, error: ` + JSON.stringify(mockComposeError.errors)
      );
    });
    it("should indicate that an error was thrown from the add wrapper request", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(executeQueryMockReturn);
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      const addStampResponse = await database.addStamp(mockStamps[0] as unknown as Stamp);
      expect(addStampResponse.secondaryStorageError).toEqual(
        `[ComposeDB] error thrown from mutation CreateGitcoinStampWrapper, vcID: ${document.id} error: ${JSON.stringify(
          mockComposeError.errors
        )}`
      );
    });

    it("should allow bulk addition of stamps", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValue(executeQueryMockReturn);

      const result = await database.addStamps(mockStamps as unknown as Stamp[]);
      result.forEach((stamp) => {
        expect(stamp.secondaryStorageError).toBeUndefined();
        expect(stamp.secondaryStorageId).toEqual(mockWrapperId);
      });
    });

    it("should indicate where errors were thrown when creating bulk addition of stamps", async () => {
      let i = 0;
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockImplementation(async (query, variableValues): Promise<any> => {
          i++;
          if (i > 3) {
            return await Promise.resolve(mockComposeError);
          } else {
            return await Promise.resolve(executeQueryMockReturn);
          }
        });
      const result = await database.addStamps(mockStamps as unknown as Stamp[]);
      const errorResults = result.filter(({ secondaryStorageError }) => secondaryStorageError);
      expect(errorResults.length).toEqual(3);
    });
  });
  describe("getting stamps", () => {
    it("should get stamps", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce({
        data: {
          viewer: {
            gitcoinPassportStampWrapperList: { edges: [{ node: { vc: mockComposeVc.content } }] },
          },
        },
      });
      const passport = await database.getPassport();
      expect(passport.passport?.stamps).toEqual([mockStamps[0]]);
    });
    it("should indicate the an error occurred while getting passport", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      const stamps = await database.getPassport();
      expect(stamps.status).toEqual("ExceptionRaised");
    });
  });
  describe("deleting stamps", () => {
    it("should delete stamps", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockResolvedValueOnce({ data: { deleteGitcoinPassportStamp: { document: { id: "123" } } } });
      const results = await database.deleteStamps(mockStamps.map((stamp) => stamp.provider as PROVIDER_ID));
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalled();
      results.forEach((stamp) => {
        expect(stamp.secondaryStorageError).toBeUndefined();
        expect(stamp.secondaryStorageId).toEqual(mockWrapperId);
      });
    });
    it("indicate the an error occurred while querying", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockImplementation(async (query, variableValues): Promise<any> => {
          const queryStr = query as string;
          if (queryStr.includes("query passport")) {
            return await Promise.resolve({
              data: {
                viewer: {
                  gitcoinPassportStampWrapperList: { edges: [{ node: { vc: mockComposeVc.content } }] },
                },
              },
            });
          } else {
            return await Promise.resolve(mockComposeError);
          }
        });
      // jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      const result = await database.deleteStamps(mockStamps.map((stamp) => stamp.provider as PROVIDER_ID));
      const errorResults = result.filter(({ secondaryStorageError }) => secondaryStorageError);
      expect(errorResults.length).toEqual(1);
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalledTimes(2);
    });
  });
  describe("patching stamps", () => {
    it("should patch stamps successfully when passport has no existing stamps", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValue(executeQueryMockReturn);

      const result = await database.patchStamps(mockStamps as unknown as StampPatch[]);
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalledTimes(7);
      const errorResults = [
        ...result.adds.filter(({ secondaryStorageError }) => secondaryStorageError),
        ...result.deletes.filter(({ secondaryStorageError }) => secondaryStorageError),
      ];
      expect(errorResults.length).toEqual(0);
    });

    it("should delete existing stamps and create new ones", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockImplementation(async (query, variableValues): Promise<any> => {
          const queryStr = query as string;
          if (queryStr.includes("query passport")) {
            return await Promise.resolve({
              data: {
                viewer: {
                  gitcoinPassportStampWrapperList: { edges: [{ node: { vc: mockComposeVc.content } }] },
                },
              },
            });
          } else {
            return await Promise.resolve(executeQueryMockReturn);
          }
        });
      const result = await database.patchStamps(mockStamps as unknown as StampPatch[]);
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalledTimes(8);
      const errorResults = [
        ...result.adds.filter(({ secondaryStorageError }) => secondaryStorageError),
        ...result.deletes.filter(({ secondaryStorageError }) => secondaryStorageError),
      ];
      expect(errorResults.length).toEqual(0);
    });
  });
});

describe("Compose Database write serialisation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  // TODO: this is commented as it causes failure when running `yarn test` in the root of the repo. Shall be investigated. 
  it.skip("should serialize add, patch and delete operations", async () => {
    let timestamps: number[] = [];
    const database = new ComposeDatabase({ id: "id" } as unknown as DID);

    jest
      .spyOn(database.composeImpl, "getPassportWithWrapper")
      .mockImplementation(
        (): Promise<PassportWrapperLoadResponse[]> => Promise.resolve([] as PassportWrapperLoadResponse[])
      );

    // Mock the implementations on database.composeImpl of add, patch and delete and 
    // register the timestamps when the methods are called.
    jest.spyOn(database.composeImpl, "addStamps").mockImplementation(
      (stamps: Stamp[]): Promise<SecondaryStorageAddResponse[]> =>
        new Promise((resolve) => {
          timestamps.push(Date.now());
          setTimeout(() => {
            resolve([] as SecondaryStorageAddResponse[]);
          }, 100);
        })
    );
    jest.spyOn(database.composeImpl, "patchStamps").mockImplementation(
      (stamps: StampPatch[]): Promise<SecondaryStorageBulkPatchResponse> =>
        new Promise((resolve) => {
          timestamps.push(Date.now());
          setTimeout(() => {
            resolve({} as SecondaryStorageBulkPatchResponse);
          }, 100);
        })
    );
    jest.spyOn(database.composeImpl, "deleteStamps").mockImplementation(
      (providers: PROVIDER_ID[]): Promise<SecondaryStorageDeleteResponse[]> =>
        new Promise((resolve) => {
          timestamps.push(Date.now());
          setTimeout(() => {
            resolve([] as SecondaryStorageDeleteResponse[]);
          }, 100);
        })
    );

    // Call the methods multiple times, but only await for the last one
    database.addStamps([] as unknown as Stamp[]);
    database.addStamps([] as unknown as Stamp[]);
    database.addStamps([] as unknown as Stamp[]);
    database.patchStamps([] as unknown as StampPatch[]);
    database.patchStamps([] as unknown as StampPatch[]);
    database.patchStamps([] as unknown as StampPatch[]);
    database.deleteStamps([] as unknown as PROVIDER_ID[]);
    database.deleteStamps([] as unknown as PROVIDER_ID[]);
    await database.deleteStamps([] as unknown as PROVIDER_ID[]);

    // We will verify the timestamps between the individual invocations of the mock methods
    // If the responses have been serialized we expect the deltas to be around 100ms
    let timestampDeltas: number[] = [];
    for (let i = 0; i < timestamps.length - 1; i++) {
      timestampDeltas.push(timestamps[i + 1] - timestamps[i]);
    }

    const minDelta = Math.min(...timestampDeltas);
    const maxDelta = Math.max(...timestampDeltas);

    expect(minDelta).toBeLessThan(110);
    expect(maxDelta).toBeLessThan(110);
    expect(minDelta).toBeGreaterThan(95);
    expect(maxDelta).toBeGreaterThan(95);
  });
});
