// ---- Testing libraries
import request from "supertest";

// ---- Test subject
import { app, config } from "../index";

// ---- Types
import { ChallengeResponseBody, VerifyResponseBody } from "@dpopp/types";

describe("POST /challenge", function () {
  it("handles valid challenge requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: "0x0",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:ethr:0x0#challenge-Simple";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ChallengeResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  // TODO new unit test --> if credential.error then return 400
  // TODO new unit test --> if !(await verifyCredential(DIDKit, credential)) then return 400
  // TODO new unit test --> if utils.getAddress fails, then ???
  // TODO new unit test --> if issueMerkleCredential fails, then ???
});

// TODO test POST /verify endpoint

describe("POST /verify", function () {
  it("handles valid challenge requests", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:ethr:0x0#challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:ethr:0x0#Simple";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body as VerifyResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  // TODO new unit test --> if credential.error then return 400
  // TODO new unit test --> if !(await verifyCredential(DIDKit, credential)) then return 400
  // TODO new unit test --> if utils.getAddress fails, then ???
  // TODO new unit test --> if issueMerkleCredential fails, then ???
});
