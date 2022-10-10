import { Passport, VerifiableCredential, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";

import { CeramicDatabase } from "../src";
import testnetAliases from "./integration-test-model-aliases.json";

let testDID: DID;
let ceramicDatabase: CeramicDatabase;

describe("Verify Ceramic Database", function () {
  beforeEach(() => {
    // jest.clearAllMocks();
  });

  describe("todo", () => {
    it("creates a ceramic database instance", async () => {
      const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

      // Create and authenticate the DID
      testDID = new DID({
        provider: new Ed25519Provider(TEST_SEED),
        resolver: getResolver(),
      });
      await testDID.authenticate();

      ceramicDatabase = new CeramicDatabase(testDID, process.env.CERAMIC_CLIENT_URL, testnetAliases);
    });
  });
});
