// ---- Test subject
import {
  issueChallengeCredential,
  issueMerkleCredential,
  verifyCredential,
  fetchChallengeCredential,
  fetchVerifiableCredential,
} from "../src/credentials";

// ---Types
import { CredentialResponseBody } from "@dpopp/types";

// ---- Generate & Verify methods
import * as DIDKit from "@dpopp/identity/dist/commonjs/didkit-node";

// @TODO - remove example key - this should be supplied by the .env
const key = JSON.stringify({
  kty: "OKP",
  crv: "Ed25519",
  x: "a7wbszn1DfZ3I7-_zDkUXCgypcGxL_cpCSTYEPRYj_o",
  d: "Z0hucmxRt1C22ygAXJ1arXwD9QlAA5tEPLb7qoXYDGY",
});

// get DID from key
const issuer = DIDKit.keyToDID("key", key);

describe("Fetch Credentials", function () {
  it("can fetch a challenge credential", async () => {
    // fetchChallengeCredential will rewrap the response of the axios post request
    const { challenge } = await fetchChallengeCredential("", {
      address: "0x0",
      type: "Simple",
      version: "0.0.0",
    });

    // check that we got back the mocked challenge response
    expect(JSON.stringify(challenge)).toEqual('{"credentialSubject":{"challenge":"this is a challenge"}}');
  });
  it("can fetch a verifiable credential", async () => {
    const { credential, record, signature, challenge } = await fetchVerifiableCredential(
      "",
      {
        address: "0x0",
        type: "Simple",
        version: "0.0.0",
      },
      {
        signMessage: async (message) => {
          return "Signed Message";
        },
      }
    );

    expect(signature).toEqual("Signed Message");
    expect(JSON.stringify(challenge)).toEqual('{"credentialSubject":{"challenge":"this is a challenge"}}');
    expect(JSON.stringify(credential)).toEqual("{}");
    expect(JSON.stringify(record)).toEqual("{}");
  });
  it("will fail if not provided a signer to sign the message", async () => {
    const { credential, record, signature, challenge } = await fetchVerifiableCredential(
      "",
      {
        address: "0x0",
        type: "Simple",
        version: "bad",
      },
      undefined
    );

    expect(signature).toEqual("");

    expect(JSON.stringify(challenge)).toEqual('{"credentialSubject":{}}');
    expect(JSON.stringify(credential)).toEqual("{}");
    expect(JSON.stringify(record)).toEqual("{}");
  });
  it("will not attempt to sign if not provided a challenge in the challenge credential", async () => {
    const { credential, record, signature, challenge } = await fetchVerifiableCredential(
      "",
      {
        address: "0x0",
        type: "Simple",
        version: "bad",
      },
      {
        signMessage: async (message) => {
          return "Signed Message";
        },
      }
    );

    expect(signature).toEqual("");

    expect(JSON.stringify(challenge)).toEqual('{"credentialSubject":{}}');
    expect(JSON.stringify(credential)).toEqual("{}");
    expect(JSON.stringify(record)).toEqual("{}");
  });
  it("will throw if signer rejects request for signature", async () => {
    await expect(
      fetchVerifiableCredential(
        "",
        {
          address: "0x0",
          type: "Simple",
          version: "0.0.0",
        },
        {
          signMessage: async (message) => {
            throw new Error("Unable to sign");
          },
        }
      )
    ).rejects.toThrow("Unable to sign");
  });
});

describe("Generate Credentials", function () {
  it("can generate a challenge credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "0.0.0",
      challenge: "randomChallengeString",
    };

    const { credential } = await issueChallengeCredential(DIDKit, key, record);

    expect(credential.credentialSubject.id).toEqual(`did:ethr:${record.address}#challenge-${record.type}`);
    expect(credential.credentialSubject.challenge).toEqual(record.challenge);
    expect(credential.credentialSubject.address).toEqual(record.address);
    expect(typeof credential.proof).toEqual("object");
  });
  it("can generate a merkle credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "0.0.0",
    };

    const { credential } = await issueMerkleCredential(DIDKit, key, record);

    expect(credential.credentialSubject.id).toEqual(`did:ethr:${record.address}#${record.type}`);
    expect(typeof credential.credentialSubject.root === "string").toEqual(true);
    expect(typeof credential.proof).toEqual("object");
  });
});

describe("Verify Credentials", function () {
  it("can verify a credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "0.0.0",
    };
    // we are creating this VC so that we know that we have a valid VC in this context to test against (never expired)
    const { credential } = await issueMerkleCredential(DIDKit, key, record);

    expect(await verifyCredential(DIDKit, credential)).toEqual(true);
  });

  it("cannot verify a credential that has been modified", async () => {
    const credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: "did:ethr:THIS_IS_A_DUMMY_ADDRESS_TO_TEST_ALTERED_SIG_VERIFY#Simple",
        "@context": [
          {
            root: "https://schema.org/Text",
          },
        ],
        root: "4tPCpmsNW5ndVJCYW9akgvXcFqVcRW7OrZH4oPBe2gE=",
      },
      issuer: "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
      issuanceDate: "2022-04-07T15:07:17.392Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod:
          "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw#z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
        created: "2022-04-07T15:07:17.392Z",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..hG5PhIsYIbzEcSWtVWxVfodzWLIgY5ZykqZwB1xbsYBSSvcgxyYUJwhf7DhBnQF9tAnDBX7F9LAciwnc__WVBg",
      },
      expirationDate: "2022-05-07T15:07:17.392Z",
    };

    expect(await verifyCredential(DIDKit, credential)).toEqual(false);
  });

  it("cannot verify a valid but expired credential", async () => {
    const credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: "did:ethr:0x0#Simple",
        "@context": [
          {
            root: "https://schema.org/Text",
          },
        ],
        root: "4tPCpmsNW5ndVJCYW9akgvXcFqVcRW7OrZH4oPBe2gE=",
      },
      issuer: "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
      issuanceDate: "2022-03-08T16:23:39.650Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod:
          "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw#z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
        created: "2022-04-07T15:23:39.650Z",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..MrSSojnjzmH_W3YWaPxt514egv994UMNUswL7Wq5s6ogx3A5Jfs7JjuucJEeMFobJ7Iuc3y28olYj-M5REVTCA",
      },
      expirationDate: "2022-03-09T16:23:39.650Z",
    };
    expect(await verifyCredential(DIDKit, credential)).toEqual(false);
  });
});
