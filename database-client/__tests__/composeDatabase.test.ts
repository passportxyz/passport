import { ComposeClient } from "@composedb/client";
import { Stamp, StampPatch, VerifiableCredential } from "@gitcoin/passport-types";
import { DID } from "dids";
import { ComposeDatabase, GraphqlResponse } from "../src/composeDatabase";
import { jest } from "@jest/globals";
import mockStamps from "./mockStamps.json";
import { GraphQLError } from "graphql";

let database: ComposeDatabase;

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

describe("Compose Database", () => {
  beforeEach(() => {
    database = new ComposeDatabase({ id: "id" } as unknown as DID);
  });
  describe("adding stamps", () => {
    it("should add a single stamp successfully", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockResolvedValue({ data: { createGitcoinPassportStamp: { document } } });

      const result = await database.addStamp(mockStamps[0] as unknown as Stamp);
      expect(result).toEqual({ status: "Success" });
    });
    it("should indicate that an error was thrown from the add vc request", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      await expect(async () => {
        return await database.addStamp(mockStamps[0] as unknown as Stamp);
      }).rejects.toThrow(
        new Error(
          `[ComposeDB] error thrown from mutation CreateGitcoinPassportVc, error: ` +
            JSON.stringify(mockComposeError.errors)
        )
      );
    });
    it("should indicate that an error was thrown from the add wrapper request", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document } } });
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
      await expect(async () => {
        return await database.addStamp(mockStamps[0] as unknown as Stamp);
      }).rejects.toThrow(
        new Error(
          `[ComposeDB] error thrown from mutation CreateGitcoinStampWrapper, vcID: ${
            document.id
          } error: ${JSON.stringify(mockComposeError.errors)}`
        )
      );
    });

    it.only("should allow bulk addition of stamps", async () => {
      let i = 0;
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockImplementation(async (query, variableValues): Promise<any> => {
          console.log("mockComposeError", i);
          i++;
          if (i > 3) {
            return await Promise.resolve(mockComposeError);
          } else {
            return await Promise.resolve({ data: { createGitcoinPassportStamp: { document } } });
          }
        });
      // if (query.includes("CreateGitcoinPassportVc") && input) {
      const result = await database.addStamps(mockStamps as unknown as Stamp[]);
      debugger;
    });
  });
  describe("deleting stamps", () => {});
  describe("patching stamps", () => {
    // it("should patch stamps", async () => {
    //   jest
    //     .spyOn(ComposeClient.prototype, "executeQuery")
    //     .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document: { id: "123" } } } });
    //   database.patchStamps(mockStamp as unknown as StampPatch[]);
    //   expect(ComposeClient.prototype.executeQuery).toHaveBeenCalled();
    // });
    // it("indicate the an error occurred while querying", async () => {
    //   jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
    // });
  });
  // describe("adding stamps", () => {
  //   it("should add stamps", async () => {
  //     jest
  //       .spyOn(ComposeClient.prototype, "executeQuery")
  //       .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document: { id: "123" } } } });
  //     database.addStamps([mockStamp as unknown as Stamp]);
  //     expect(ComposeClient.prototype.executeQuery).toHaveBeenCalled();
  //   });
  //   it("indicate the an error occurred while querying", async () => {
  //     jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
  //   });
  // });
  // describe("getting a passport", () => {
  //   it("should get stamps", async () => {
  //     jest
  //       .spyOn(ComposeClient.prototype, "executeQuery")
  //       .mockResolvedValueOnce({ data: { viewer: { gitcoinPassportStampWrapperList: [{ document: mockStamp }] } } });
  //     const stamps = await database.getPassport();
  //     expect(stamps).toEqual([mockStamp]);
  //   });
  //   it("should indicate the an error occurred while querying", async () => {
  //     jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
  //     const stamps = await database.getPassport();
  //     expect(stamps).toEqual({ status: "ExceptionRaised" });
  //   });
  // });
});
