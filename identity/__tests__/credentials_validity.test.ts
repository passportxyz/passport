import { VerifiableEip712Credential } from "@gitcoin/passport-types";
import { issueNullifiableCredential } from "../src/credentials.js";
import { HashNullifierGenerator } from "../src/nullifierGenerators.js";
import { generateEIP712PairJWK, objToSortedArray } from "../src/helpers";
import * as DIDKit from "@spruceid/didkit-wasm-node";
import * as base64 from "@ethersproject/base64";

// ---- crypto lib for hashing
import { createHash } from "crypto";

// this would need to be a valid key but we've mocked out didkit (and no verifications are made)
describe("EIP712 credential", function () {
  it("can issue credentials with valid EIP712 signature, and ethers can validate the credential", async () => {
    const originalEthers = jest.requireActual<typeof import("ethers")>("ethers");

    const record = {
      type: "Simple",
      version: "Test-Case-1",
      address: "0x0",
    };

    const issuerKey = generateEIP712PairJWK();

    const expectedHash: string =
      "v1:" +
      base64.encode(
        createHash("sha256")
          .update(issuerKey)
          .update(JSON.stringify(objToSortedArray(record)))
          .digest()
      );

    // Details of this credential are created by issueNullifiableCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueNullifiableCredential({
      DIDKit,
      issuerKey,
      address: "0x0",
      record,
      expiresInSeconds: 100,
      signatureType: "EIP712",
      nullifierGenerators: [HashNullifierGenerator({ key: issuerKey, version: 1 })],
    });

    const signedCredential = credential as VerifiableEip712Credential;

    const standardizedTypes = signedCredential.proof.eip712Domain.types;
    const domain = signedCredential.proof.eip712Domain.domain;

    // Delete EIP712Domain so that ethers does not complain about the ambiguous primary type
    delete standardizedTypes.EIP712Domain;

    const signerAddress = originalEthers.verifyTypedData(
      domain,
      standardizedTypes,
      signedCredential,
      signedCredential.proof.proofValue
    );

    const issuer = DIDKit.keyToDID("ethr", issuerKey);

    const expectedEthSignerAddress = issuer.split(":").pop();
    expect(signerAddress.toLowerCase()).toEqual(expectedEthSignerAddress);
    expect(signedCredential.credentialSubject.nullifiers?.[0]).toEqual(expectedHash);
  });

  describe("with legacy credential format", () => {
    let originalEnv: NodeJS.ProcessEnv;
    beforeEach(() => {
      originalEnv = process.env;
      process.env.FF_ROTATING_KEYS = "off";
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("can issue credentials with valid EIP712 signature, and ethers can validate the credential", async () => {
      const originalEthers = jest.requireActual<typeof import("ethers")>("ethers");

      const record = {
        type: "Simple",
        version: "Test-Case-1",
        address: "0x0",
      };

      const issuerKey = generateEIP712PairJWK();

      const expectedHash: string =
        "v0.0.0:" +
        base64.encode(
          createHash("sha256")
            .update(issuerKey)
            .update(JSON.stringify(objToSortedArray(record)))
            .digest()
        );

      // Details of this credential are created by issueNullifiableCredential - but the proof is added by DIDKit (which is mocked)
      const { credential } = await issueNullifiableCredential({
        DIDKit,
        issuerKey,
        address: "0x0",
        record,
        expiresInSeconds: 100,
        signatureType: "EIP712",
        nullifierGenerators: [HashNullifierGenerator({ key: issuerKey, version: "0.0.0" })],
      });

      const signedCredential = credential as VerifiableEip712Credential;

      const standardizedTypes = signedCredential.proof.eip712Domain.types;
      const domain = signedCredential.proof.eip712Domain.domain;

      // Delete EIP712Domain so that ethers does not complain about the ambiguous primary type
      delete standardizedTypes.EIP712Domain;

      const signerAddress = originalEthers.verifyTypedData(
        domain,
        standardizedTypes,
        signedCredential,
        signedCredential.proof.proofValue
      );

      const issuer = DIDKit.keyToDID("ethr", issuerKey);

      const expectedEthSignerAddress = issuer.split(":").pop();
      expect(signerAddress.toLowerCase()).toEqual(expectedEthSignerAddress);
      expect(signedCredential.credentialSubject.nullifiers).toBeUndefined();
      expect(signedCredential.credentialSubject.hash).toEqual(expectedHash);
    });
  });
});
