import { parseScoreFromAttestation, Attestation } from "../eas"; // Replace with the actual file name

describe("parseScoreFromAttestation", () => {
  const validSchemaId = "0x6ab5d34260fca0cfcf0e76e96d439cace6aa7c3c019d7c4580ed52c6845e9c89";

  const createMockAttestation = (overrides = {}): Attestation => ({
    recipient: "0x1234567890123456789012345678901234567890",
    revocationTime: 0,
    revoked: false,
    expirationTime: 0,
    schema: { id: validSchemaId },
    decodedDataJson: JSON.stringify([
        {
          name: "score",
          type: "uint256",
          signature: "uint256 score",
          value: {
            name: "score",
            type: "uint256",
            value: {
              type: "BigNumber",
              hex: "0x01ab80a606f3884000"
            }
          }
        },
        {
          name: "scorer_id",
          type: "uint32",
          signature: "uint32 scorer_id",
          value: {
            name: "scorer_id",
            type: "uint32",
            value: 335
          }
        },
        {
          name: "score_decimals",
          type: "uint8",
          signature: "uint8 score_decimals",
          value: {
            name: "score_decimals",
            type: "uint8",
            value: 18
          }
        }
      ]),
    ...overrides
  });

  it("should return valid score adjusted for decimals", () => {
    const attestations = [createMockAttestation()];
    const result = parseScoreFromAttestation(attestations, validSchemaId);
    expect(result).toEqual(30.804804);
  });

  it("should return null score when score_decimals is missing", () => {
    const attestations = [createMockAttestation({
      decodedDataJson: JSON.stringify([
        {
          name: "score",
          type: "uint256",
          signature: "uint256 score",
          value: {
            name: "score",
            type: "uint256",
            value: {
              type: "BigNumber",
              hex: "0x01ab80a606f3884000"
            }
          }
        }
      ])
    })];
    const result = parseScoreFromAttestation(attestations, validSchemaId);
    expect(result).toEqual(null);
  });

  it("should handle different decimal values", () => {
    const attestations = [createMockAttestation({
      decodedDataJson: JSON.stringify([
        {
          name: "score",
          type: "uint256",
          signature: "uint256 score",
          value: {
            name: "score",
            type: "uint256",
            value: {
              type: "BigNumber",
              hex: "0x0100000000"
            }
          }
        },
        {
          name: "score_decimals",
          type: "uint8",
          signature: "uint8 score_decimals",
          value: {
            name: "score_decimals",
            type: "uint8",
            value: 5
          }
        }
      ])
    })];
    const result = parseScoreFromAttestation(attestations, validSchemaId);
    expect(result).toEqual(42949.67296);
  });
});