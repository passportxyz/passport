import request from "supertest";
import { VerifiableCredential } from "@gitcoin/passport-types";

import { MultiAttestationRequest, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";
import { app } from "../src/index";
import { getAttestationDomainSeparator } from "../src/utils/attestations";
import { parseEther } from "ethers";
import { toJsonObject } from "../src/utils/json";
import * as easFees from "../src/utils/easFees";
import * as identityMock from "../src/utils/identityHelper";
import * as easScoreSchema from "../src/utils/easScoreSchema";

jest.mock("../src/utils/revocations", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("../src/utils/easScoreSchema", () => ({
  ...jest.requireActual("../src/utils/easScoreSchema"),
  generateScoreAttestationRequest: jest.fn(),
}));

jest.mock("../src/utils/easFees", () => ({
  getEASFeeAmount: jest.fn(),
}));

jest.mock("../src/utils/identityHelper", () => {
  const originalIdentity = jest.requireActual("@gitcoin/passport-identity");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(originalIdentity.verifyCredential),
  };
});

const issuerDid = identityMock.getIssuerInfo().issuer.did;
const generateScoreAttestationRequest = easScoreSchema.generateScoreAttestationRequest as jest.Mock;
const getEASFeeAmountMock = easFees.getEASFeeAmount as jest.Mock;
const verifyCredentialMock = identityMock.verifyCredential as jest.Mock;

const chainIdHex = "0xa";

const mockRecipient = "0x5678000000000000000000000000000000000000";
const mockMultiAttestationRequest: MultiAttestationRequest[] = [
  {
    schema: "0xda0257756063c891659fed52fd36ef7557f7b45d66f59645fd3c3b263b747254",
    data: [
      {
        recipient: mockRecipient,
        data: easScoreSchema.encodeScoreData({
          passing_score: true,
          score: BigInt("301001"),
          threshold: BigInt("200000"),
          score_decimals: BigInt(4),
          scorer_id: BigInt(1),
          stamps: [
            {
              provider: "NFT",
              score: BigInt("20001"),
            },
            {
              provider: "CoinbaseDualVerification2",
              score: BigInt("10100"),
            },
          ],
        }),
        expirationTime: BigInt(Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 70),
        revocable: true,
        refUID: ZERO_BYTES32,
        value: BigInt("0"),
      },
    ],
  },
];

describe("POST /eas/scoreV2", () => {
  const recipient = mockRecipient;

  beforeEach(() => {
    getEASFeeAmountMock.mockReturnValue(Promise.resolve(parseEther("0.025")));
    generateScoreAttestationRequest.mockResolvedValue(mockMultiAttestationRequest);
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  it("properly formats domain separator", () => {
    const domainSeparator = getAttestationDomainSeparator("0xa");
    expect(domainSeparator).toEqual({
      name: "GitcoinVerifier",
      version: "1",
      chainId: "10",
      verifyingContract: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
    });
  });

  it("handles bad chain ID", async () => {
    const nonce = 0;
    const response = await request(app)
      .post("/api/v0.0.0/eas/scoreV2")
      .send({ recipient, nonce, chainIdHex: "0x694206969" })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No onchainInfo found for chainId 0x694206969");
  });

  it("handles invalid recipient in the request body", async () => {
    const nonce = 0;

    const response = await request(app)
      .post("/api/v0.0.0/eas/scoreV2")
      .send({ recipient: recipient.substring(0, 12), nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("returns the fee information in the response as wei units", async () => {
    verifyCredentialMock.mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    const nonce = 0;
    const expectedFeeUsd = parseFloat(process.env.EAS_FEE_USD as string);

    expect(expectedFeeUsd).toBeDefined();
    expect(typeof expectedFeeUsd).toBe("number");
    expect(expectedFeeUsd).toBeGreaterThan(1);

    const expectedPayload = {
      passport: {
        multiAttestationRequest: toJsonObject(mockMultiAttestationRequest),
        fee: "25000000000000000",
        nonce,
      },
      signature: expect.any(Object),
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas/scoreV2")
      .send({ recipient, nonce, chainIdHex })
      .set("Accept", "application/json");

    expect(response.body).toMatchObject(expectedPayload);
    expect(getEASFeeAmountMock).toHaveBeenCalledTimes(1);
    expect(getEASFeeAmountMock).toHaveBeenCalledWith(expectedFeeUsd);
  });
});
