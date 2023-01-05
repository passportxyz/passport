// ---- Testing libraries
import request from "supertest";

// ---- Test subject
import { app, config } from "../src/index";
import { providers } from "@gitcoin/passport-platforms";

// ---- Types
import {
  ErrorResponseBody,
  ProviderContext,
  RequestPayload,
  ValidResponseBody,
  VerifiedPayload,
} from "@gitcoin/passport-types";

import * as identityMock from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

import { utils } from "ethers";

jest.mock("ethers", () => {
  return {
    utils: {
      getAddress: jest.fn().mockImplementation(() => {
        return "0x0";
      }),
      verifyMessage: jest.fn().mockImplementation(() => {
        return "string";
      }),
    },
  };
});

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
    expect((response.body as ErrorResponseBody).error).toEqual("Missing address from challenge request body");
  });

  it("handles missing type from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Missing type from challenge request body");
  });

  it("handles malformed payload from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = "bad :(";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);
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

  it("handles valid challenge request returning PII", async () => {
    const provider = "ClearTextSimple";
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: `challenge-${provider}`,
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: provider,
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

    const expectedProvider = `${provider}#Username`;

    // check that PII is returned with provider
    expect((response.body as ValidResponseBody).credential.credentialSubject.provider).toEqual(expectedProvider);
    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid challenge requests with multiple types", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
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
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid challenge requests with multiple types, and acumulates values between provider calls", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-GitcoinContributorStatistics#numGrantsContributeToGte#10",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "GitcoinContributorStatistics#numGrantsContributeToGte#10",
      types: [
        "GitcoinContributorStatistics#numGrantsContributeToGte#10",
        "GitcoinContributorStatistics#numGrantsContributeToGte#25",
        "GitcoinContributorStatistics#numGrantsContributeToGte#100",
      ],
      address: "0x0",
      proofs: {
        code: "SECRET_CODE",
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // spy on the providers
    jest
      .spyOn(providers._providers["GitcoinContributorStatistics#numGrantsContributeToGte#10"], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        context["update_1"] = true;
        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "10",
          },
        };
      });
    jest
      .spyOn(providers._providers["GitcoinContributorStatistics#numGrantsContributeToGte#25"], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        context["update_2"] = true;

        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "25",
          },
        };
      });
    const gitcoinGte100 = jest
      .spyOn(providers._providers["GitcoinContributorStatistics#numGrantsContributeToGte#100"], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "100",
          },
        };
      });

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
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);

    expect(gitcoinGte100).toBeCalledWith(
      {
        issuer: config.issuer,
        type: "GitcoinContributorStatistics#numGrantsContributeToGte#10",
        types: [
          "GitcoinContributorStatistics#numGrantsContributeToGte#10",
          "GitcoinContributorStatistics#numGrantsContributeToGte#25",
          "GitcoinContributorStatistics#numGrantsContributeToGte#100",
        ],
        address: "0x0",
        proofs: { code: "SECRET_CODE" },
      },
      // The expected acumulated value in the context
      { update_1: true, update_2: true }
    );
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
      .expect(401)
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
      .expect(401)
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
      .expect(403)
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
      .expect(500)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge request passed by the additional signer", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true).mockResolvedValue(false);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);
  });

  it("handles valid challenge request passed by the additional signer", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        signature: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);
  });
  it("should not issue credential for additional signer when invalid address is provided", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0xbadAddress",
        signature: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);
  });
});
