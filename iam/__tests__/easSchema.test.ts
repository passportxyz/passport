import { encodeEasStamp } from "../src/utils/easSchema";
import { VerifiableCredential } from "@gitcoin/passport-types";

describe("easSchema", () => {
  it("returns a valid encoded schema", () => {
    const verifiableCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "SomeProvider",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "string",
      expirationDate: "string",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const encodedData = encodeEasStamp(verifiableCredential);
  });
});
