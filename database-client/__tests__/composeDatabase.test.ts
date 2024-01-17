import { ComposeClient } from "@composedb/client";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { DID } from "dids";
import { ComposeDatabase } from "../src/composeDatabase";
import { stamps } from "./passportScorerClient.test";
import { jest } from "@jest/globals";

let database: ComposeDatabase;

describe("Compose Database", () => {
  beforeEach(() => {
    database = new ComposeDatabase({ id: "id" } as unknown as DID);
  });
  it("should add stamps", async () => {
    jest
      .spyOn(ComposeClient.prototype, "executeQuery")
      .mockResolvedValueOnce({ data: { createGitcoinPassportStamp: { document: { id: "123" } } } });
    database.addStamps(stamps);
  });
});
