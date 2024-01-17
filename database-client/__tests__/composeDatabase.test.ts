import { ComposeClient } from "@composedb/client";
import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { DID } from "dids";
import { ComposeDatabase } from "../src/composeDatabase";
import { jest } from "@jest/globals";
import mockStamp from "./mockStamp.json";

let database: ComposeDatabase;

describe("Compose Database", () => {
  beforeEach(() => {
    database = new ComposeDatabase({ id: "id" } as unknown as DID);
  });
  describe("adding stamps", () => {
    it("should add stamps", async () => {
      jest
        .spyOn(ComposeClient.prototype, "executeQuery")
        .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document: { id: "123" } } } });
      database.addStamps([mockStamp as unknown as Stamp]);
      expect(ComposeClient.prototype.executeQuery).toHaveBeenCalled();
    });
  });
});
