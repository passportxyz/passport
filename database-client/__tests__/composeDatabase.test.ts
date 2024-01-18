import { ComposeClient } from "@composedb/client";
import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { DID } from "dids";
import { ComposeDatabase } from "../src/composeDatabase";
import { jest } from "@jest/globals";
import mockStamp from "./mockStamp.json";
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

describe("Compose Database", () => {
  beforeEach(() => {
    database = new ComposeDatabase({ id: "id" } as unknown as DID);
  });
  describe("patching stamps", () => {
    it("should patch stamps", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document: { id: "123" } } } });
      database.patchStamps([mockStamp as unknown as Stamp]);
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalled();
    });
    it("indicate the an error occurred while querying", async () => {
      jest.spyOn(ComposeClient.prototype, "executeQuery").mockResolvedValueOnce(mockComposeError);
    });
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
