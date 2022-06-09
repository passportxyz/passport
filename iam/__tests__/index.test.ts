// ---- Testing libraries
import request from "supertest";

// ---- Test subject
import { app, config } from "../src/index";

// ---- Types
import { ErrorResponseBody, ValidResponseBody } from "@gitcoin/passport-types";

import * as identityMock from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

describe("POST /challenge", function () {
  it("handles valid challenge requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: "0x0",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  it("handles missing address from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });
});

describe("POST /verify", function () {
  it("handles valid challenge requests", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
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

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles invalid challenge requests where credential.issuer is unknown", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: "unknown",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
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

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge requests where challenge credential subject signature checks fail", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress#challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge requests where 'valid' proof is passed as false (test against Simple Provider)", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify proofs");
  });

  it("handles exception if verify credential throws", async () => {
    jest.spyOn(identityMock, "verifyCredential").mockRejectedValue("Verify Credential Error");

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress",
        type: "challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });
});
