import * as easPassportModule from "../src/utils/easPassportSchema";
import * as easStampModule from "../src/utils/easStampSchema";

import { VerifiableCredential } from "@gitcoin/passport-types";
import { BigNumber } from "ethers";
import { NO_EXPIRATION, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

jest.mock("../src/utils/scorerService", () => ({
  fetchPassportScore: jest.fn(),
}));

const ensProviderConfig = {
  platformGroup: "Account Name",
  providers: [
    {
      title: "Encrypted",
      name: "Ens",
      hash: "0xb4448bd57db012361e41665a60f3906dda48b4ffc1e4b8151cb2b6d431861fae",
    },
  ],
};

describe("eas encoding", () => {
  it("should use encodeEasStamp to format stamp data correctly", () => {
    const verifiableCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "Ens",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "2023-05-10T11:00:14.986Z",
      expirationDate: "string",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const encodedData = easPassportModule.encodeEasPassport([verifiableCredential]);
    const stampSchemaEncoder = new SchemaEncoder("uint256[] providers, bytes32[] hashes, uint64[] issuanceDates");
    const decodedStampData = stampSchemaEncoder.decodeData(encodedData);
    console.log(">>>>>>>>> decodedStampData", decodedStampData);
    console.log(">>>>>>>>> decodedStampData.length", decodedStampData.length);
    const providers = decodedStampData[0].value.value as BigNumber[];
    const hashes = decodedStampData[1].value.value as string[];
    const issuanceDates = decodedStampData[2].value.value as BigNumber[];
    console.log(">>>>>>>>> providers", providers);
    console.log(">>>>>>>>> hashes", hashes);
    console.log(">>>>>>>>> issuanceDates", issuanceDates);
    expect(providers.length).toEqual(1);
    // expect(providers[0]).toEqual(ensProviderConfig.providers[0].hash);
    expect(hashes.length).toEqual(1);
    // expect(hashes[0]).toEqual(ensProviderConfig.providers[0].hash);
    expect(issuanceDates.length).toEqual(1);
    expect(issuanceDates[0]).toEqual(BigNumber.from(Math.floor(new Date("2023-05-10T11:00:14.986Z").getTime() / 1000)));
  });
});

const defaultRequestData = {
  recipient: "0x123",
  expirationTime: NO_EXPIRATION,
  revocable: true,
  refUID: ZERO_BYTES32,
  value: 0,
};

describe("formatMultiAttestationRequest", () => {
  it("should return formatted attestation request", async () => {
    jest.spyOn(easPassportModule, "encodeEasPassport").mockReturnValue("0x00000000000000000000000");
    jest.spyOn(easStampModule, "encodeEasScore").mockReturnValue("0x00000000000000000000000");

    const validatedCredentials = [
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential1",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
          issuanceDate: "2023-05-10T11:00:14.986Z",
        } as unknown as VerifiableCredential,
        verified: true,
      },
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential2",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
          issuanceDate: "2023-05-10T11:00:14.986Z",
        } as unknown as VerifiableCredential,
        verified: false,
      },
    ];

    const recipient = "0x123";

    const result = await easPassportModule.formatMultiAttestationRequest(validatedCredentials, recipient);

    expect(result).toEqual([
      {
        schema: process.env.EAS_GITCOIN_PASSPORT_SCHEMA,
        data: [
          {
            ...defaultRequestData,
            data: "0x00000000000000000000000",
          },
        ],
      },
      {
        schema: process.env.EAS_GITCOIN_SCORE_SCHEMA,
        data: [
          {
            ...defaultRequestData,
            data: "0x00000000000000000000000",
          },
        ],
      },
    ]);
  });
});
