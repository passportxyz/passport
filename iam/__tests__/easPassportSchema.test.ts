import * as easPassportModule from "../src/utils/easPassportSchema";
import * as easStampModule from "../src/utils/easStampSchema";
import axios from "axios";

import { VerifiableCredential } from "@gitcoin/passport-types";
import { BigNumber } from "ethers";
import { NO_EXPIRATION, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

jest.mock("../src/utils/scorerService", () => ({
  fetchPassportScore: jest.fn(),
}));

describe("eas encoding", () => {
  it("should use encodeEasStamp to format stamp data correctly", async () => {
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
      expirationDate: "2023-08-10T11:00:14.986Z",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const encodedData = await easPassportModule.encodeEasPassport([verifiableCredential]);
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
    jest.spyOn(easPassportModule, "encodeEasPassport").mockReturnValue(Promise.resolve("0x00000000000000000000000"));
    jest.spyOn(easStampModule, "encodeEasScore").mockReturnValue("0x00000000000000000000000");

    const validatedCredentials = [
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential1",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
          issuanceDate: "2023-05-10T11:00:14.986Z",
          expirationDate: "2023-08-10T11:00:14.986Z",
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
          expirationDate: "2023-08-10T11:00:14.986Z",
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

describe("formatPassportAttestationData", () => {
  it("should format attestation data correctly", async () => {
    // Prepare a mock credential
    const mockCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "mockProvider",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    // Prepare a mock stamp
    const mockStamp = {
      name: "mockProvider",
      index: 0,
      bit: 1,
    };

    const passportAttestationStampMap: Map<string, easPassportModule.PassportAttestationStamp> = new Map();

    passportAttestationStampMap.set(mockCredential.credentialSubject.provider, mockStamp);

    jest.spyOn(easPassportModule, "buildProviderBitMap").mockResolvedValue(passportAttestationStampMap);

    const result: easPassportModule.PassportAttestationData = await easPassportModule.formatPassportAttestationData([
      mockCredential,
    ]);

    // Check that the resulting providers array has the expected value
    // For the mockStamp, it should be [BigNumber.from(1 << 1)]
    expect(result.providers).toEqual([BigNumber.from(1 << mockStamp.bit)]);

    // Check that the info array contains an object with the expected values
    expect(result.info).toHaveLength(1);
    expect(result.info[0]).toMatchObject({
      hash: "0x" + Buffer.from(mockCredential.credentialSubject.hash.split(":")[1], "base64").toString("hex"),
      issuanceDate: BigNumber.from(Math.floor(new Date(mockCredential.issuanceDate).getTime() / 1000)),
      expirationDate: BigNumber.from(Math.floor(new Date(mockCredential.expirationDate).getTime() / 1000)),
      stampInfo: mockStamp,
    });
  });
  it("should return multiple provider bitmaps/bns if index exceeds range", async () => {
    // Prepare a mock credential
    const mockCredential = {
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "mockProvider",
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
    } as unknown as VerifiableCredential;

    const mockCredential1 = {
      credentialSubject: {
        hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
        provider: "mockProvider1",
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
    } as unknown as VerifiableCredential;

    // Prepare a mock stamp
    const mockStamp = {
      name: "mockProvider",
      index: 0,
      bit: 1,
    };

    const mockStamp1 = {
      name: "mockProvider1",
      index: 1,
      bit: 0,
    };

    const passportAttestationStampMap: Map<string, easPassportModule.PassportAttestationStamp> = new Map();

    // Add the mock stamps to the map
    passportAttestationStampMap.set(mockCredential.credentialSubject.provider, mockStamp);
    passportAttestationStampMap.set(mockCredential1.credentialSubject.provider, mockStamp1);

    jest.spyOn(easPassportModule, "buildProviderBitMap").mockResolvedValue(passportAttestationStampMap);

    const result: easPassportModule.PassportAttestationData = await easPassportModule.formatPassportAttestationData([
      mockCredential,
      mockCredential1,
    ]);

    expect(result.providers).toEqual([BigNumber.from(1 << mockStamp.bit), BigNumber.from(1 << mockStamp1.bit)]);

    // Check that the info array contains an object with the expected values
    expect(result.info).toHaveLength(2);
    expect(result.info[0]).toMatchObject({
      hash: "0x" + Buffer.from(mockCredential.credentialSubject.hash.split(":")[1], "base64").toString("hex"),
      issuanceDate: BigNumber.from(Math.floor(new Date(mockCredential.issuanceDate).getTime() / 1000)),
      expirationDate: BigNumber.from(Math.floor(new Date(mockCredential.expirationDate).getTime() / 1000)),
      stampInfo: mockStamp,
    });
  });
});

describe("sortPassportAttestationData", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("should correctly utilize the first bit of the new bitmap when a new bitmap is created", async () => {
    const stampNames = Array(257)
      .fill(null)
      .map((_, idx) => `stamp${idx}`);
    const groupStamps = stampNames.map((name) => ({ name }));
    const group = { name: "group1", stamps: groupStamps };
    const stampMetadata: easPassportModule.StampMetadata = [{ id: "1", name: "metadata1", groups: [group] }];

    jest.spyOn(axios, "get").mockResolvedValue({ data: stampMetadata });

    const bitmap = await easPassportModule.buildProviderBitMap();

    expect(bitmap.get("stamp255")).toEqual({ bit: 255, index: 0, name: "stamp255" });
    expect(bitmap.get("stamp256")).toEqual({ bit: 0, index: 1, name: "stamp256" });
  });
  it("should correctly sort the Attestation data", () => {
    const stamp1 = {
      name: "TestStamp1",
      index: 2,
      bit: 1,
    };

    const stamp2 = {
      name: "TestStamp2",
      index: 1,
      bit: 2,
    };

    const stamp3 = {
      name: "TestStamp3",
      index: 2,
      bit: 0,
    };

    const attestation: easPassportModule.PassportAttestationData = {
      providers: [BigNumber.from(3), BigNumber.from(1), BigNumber.from(2)],
      info: [
        {
          hash: "0x123",
          issuanceDate: BigNumber.from(1000),
          expirationDate: BigNumber.from(2000),
          stampInfo: stamp1,
        },
        {
          hash: "0x456",
          issuanceDate: BigNumber.from(1001),
          expirationDate: BigNumber.from(2001),
          stampInfo: stamp2,
        },
        {
          hash: "0x789",
          issuanceDate: BigNumber.from(1002),
          expirationDate: BigNumber.from(2002),
          stampInfo: stamp3,
        },
      ],
    };

    const sortedAttestation: easPassportModule.AttestationData =
      easPassportModule.sortPassportAttestationData(attestation);

    expect(sortedAttestation.hashes).toEqual(["0x456", "0x789", "0x123"]);
    expect(sortedAttestation.issuancesDates).toEqual([
      BigNumber.from(1001),
      BigNumber.from(1002),
      BigNumber.from(1000),
    ]);
    expect(sortedAttestation.expirationDates).toEqual([
      BigNumber.from(2001),
      BigNumber.from(2002),
      BigNumber.from(2000),
    ]);
  });
});
