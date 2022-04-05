import request from "supertest";
import { app } from "../index";

describe("POST /challenge", function () {
  it("handles valid challenge requests", async () => {
    const payload = {
      type: "Simple",
      address: "0xcf0639A8102D94EE7424e71C017379B99Bc36893",
    };
    const expectedResponse = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: "did:ethr:0xd23e91f4252d57aF484CE64BD02F3c693a9F83D9#Simple",
        root: "SZYY9hw6+iBFH8YI0GYalosmpOfGDgVnBcMpjLcsnqQ=",
        "@context": [
          {
            root: "https://schema.org/Text",
          },
        ],
      },
      issuer: "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
      issuanceDate: "2022-04-05T19:27:40.358Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod:
          "did:key:z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw#z6Mkmhp2sE9s4AxFrKUXQjcNxbDV7WTM8xdh1FDNmNDtogdw",
        created: "2022-04-05T19:27:40.358Z",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..NvVCewNj8GzgUPdmelVqi5U4VJo6P6tWgu11gvW99s2wmsfZjBarkm7zNi2rPVIKJBceOo09YXGnQuknWa_SCQ",
      },
      expirationDate: "2022-05-05T19:27:40.358Z",
    };

    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);
    // expect(response.status).toEqual(200);
    expect(response.body).toEqual(expectedResponse);
  });

  // TODO new unit test --> if credential.error then return 400
  // TODO new unit test --> if !(await verifyCredential(DIDKit, credential)) then return 400
  // TODO new unit test --> if utils.getAddress fails, then ???
  // TODO new unit test --> if issueMerkleCredential fails, then ???
});

// TODO test POST /verify endpoint
