// --- Test subject
import { BrightIdProvider } from "../src/providers/brightid";
import { triggerBrightidSponsorship } from "../src/procedures/brightid";
import { BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "@gitcoin/passport-types";
import { RequestPayload } from "@gitcoin/passport-types";
import { verifyContextId, sponsor } from "brightid_sdk";

jest.mock("brightid_sdk", () => ({
  verifyContextId: jest.fn(),
  sponsor: jest.fn(),
}));

describe("Attempt BrightId", () => {
  const did = "did:pkh:eip155:1:0x0";
  const nonUniqueResponse: BrightIdVerificationResponse = {
    unique: false,
    app: "Gitcoin",
    context: "Gitcoin",
    contextIds: ["sampleContextId"],
  };

  const validVerificationResponse: BrightIdVerificationResponse = {
    unique: true,
    app: "Gitcoin",
    context: "Gitcoin",
    contextIds: ["sampleContextId"],
  };

  let invalidVerificationResponse: BrightIdVerificationResponse = {
    status: 400,
    statusText: "Not Found",
    data: {
      error: true,
      errorNum: 2,
      errorMessage: "Not Found",
      contextIds: ["sampleContextId"],
      code: 400,
    },
  };

  const validSponsorshipResponse: BrightIdSponsorshipResponse = {
    status: "success",
    statusReason: "successfulStatusReason",
  };

  let invalidSponsorshipResponse: BrightIdSponsorshipResponse = {
    status: 404,
    statusText: "Not Found",
    data: {
      error: true,
      errorNum: 12,
      errorMessage: "Passport app is not found.",
      code: 404,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Handles Verification", () => {
    it("valid BrightId did as contextId verification attempt, returns valid true, verifies if user has Meet status and verified contextId", async () => {
      (verifyContextId as jest.Mock).mockResolvedValue(validVerificationResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(verifyContextId).toBeCalledTimes(1);
      expect(verifyContextId).toBeCalledWith("Gitcoin", did);
      expect(result).toMatchObject({
        valid: true,
        record: {
          contextId: "sampleContextId",
          meets: "true",
        },
      });
    });

    it("invalid BrightId did as contextId verification attempt, returns valid false and record undefined", async () => {
      (verifyContextId as jest.Mock).mockResolvedValue(invalidVerificationResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(verifyContextId).toBeCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
        record: undefined,
      });
    });

    it("thrown error from BrightId did as contextId verification attempt, returns valid false", async () => {
      (verifyContextId as jest.Mock).mockRejectedValue("Thrown Error");

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(verifyContextId).toBeCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
      });
    });

    it("user is sponsored but did not attend a connection party, returns valid false and record undefined", async () => {
      (verifyContextId as jest.Mock).mockResolvedValue(nonUniqueResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(verifyContextId).toBeCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
        record: undefined,
      });
    });
  });

  describe("Handles Sponsorship", () => {
    it("successful attempt", async () => {
      (sponsor as jest.Mock).mockResolvedValue(validSponsorshipResponse);
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toBeCalledTimes(1);
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY, "Gitcoin", did);
      expect(result).toMatchObject({
        valid: true,
        result: validSponsorshipResponse,
      });
    });

    it("unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockResolvedValue(invalidSponsorshipResponse);
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toBeCalledTimes(1);
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY, "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
        result: invalidSponsorshipResponse,
      });
    });

    it("error thrown from an unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockRejectedValue("Thrown Error");
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toBeCalledTimes(1);
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY, "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
        error: "Thrown Error",
      });
    });
  });
});
