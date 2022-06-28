// ---- Testing libraries
import request from "supertest";
// ---- Test subject
import { app } from "../src/index";

// ---- Types
import { ValidResponseBody } from "@gitcoin/passport-types";

describe("Correctly issueing Verifiable Credential with whitelisted address as VC address", function()  {
  it("handles valid challenge requests", async () => {
      // as each signature is unique, each request results in unique output
      const payload = {
        type: "GoodDollar",
        address: "0x0",
        proofs: {
          whitelistedAddress: "0x1"
        }
      };
  
      // check that ID matches the payload (this has been mocked)
      const expectedId = `did:pkh:eip155:1:0x0`;
  
      // create a req against the express app
      const response = await request(app)
        .post("/api/v0.0.0/challenge")
        .send({ payload })
        .set("Accept", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);
  
      // expect the mocked credential to be returned and contain the expectedId
      expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
      expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.address).toEqual(payload.proofs.whitelistedAddress);
  });
})