// --- Test subject
import { BrightIdProvider } from "../Providers/brightid";
import { triggerBrightidSponsorship } from "../procedures/brightid";
import { BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "@gitcoin/passport-types";
import { RequestPayload } from "@gitcoin/passport-types";
import { verifyContextId, sponsor } from "brightid_sdk";
import { ProviderExternalVerificationError } from "../../types";

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

  const invalidVerificationResponse: BrightIdVerificationResponse = {
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

  const invalidSponsorshipResponse: BrightIdSponsorshipResponse = {
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

      expect(verifyContextId).toHaveBeenCalledTimes(1);
      expect(verifyContextId).toHaveBeenCalledWith("Gitcoin", did);
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

      expect(verifyContextId).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
        record: undefined,
        errors: ["You have not met the BrightID verification requirements"],
      });
    });

    it("thrown error from BrightId did as contextId verification attempt, returns valid false", async () => {
      (verifyContextId as jest.Mock).mockRejectedValue(
        "Error verifying BrightID sponsorship: TypeError: Cannot use 'in' operator to search for 'unique' in undefined"
      );

      await expect(async () => {
        return await new BrightIdProvider().verify({
          proofs: {
            did,
          },
        } as unknown as RequestPayload);
      }).rejects.toThrow(ProviderExternalVerificationError);

      expect(verifyContextId).toHaveBeenCalledTimes(1);
    });

    it("user is sponsored but did not attend a connection party, returns valid false, record undefined, and error reason", async () => {
      (verifyContextId as jest.Mock).mockResolvedValueOnce(nonUniqueResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(verifyContextId).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
        record: undefined,
        errors: [
          `You have not met the BrightID verification requirements by attending a connection party -- isUnique: ${String(
            nonUniqueResponse.unique
          )} & firstContextId: ${nonUniqueResponse.contextIds[0]}`,
        ],
      });
    });
  });

  describe("Handles Sponsorship", () => {
    it("successful attempt", async () => {
      (sponsor as jest.Mock).mockResolvedValue(validSponsorshipResponse);
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toHaveBeenCalledTimes(1);
      expect(sponsor).toHaveBeenCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: true,
        result: validSponsorshipResponse,
      });
    });

    it("unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockResolvedValue(invalidSponsorshipResponse);
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toHaveBeenCalledTimes(1);
      expect(sponsor).toHaveBeenCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
        result: invalidSponsorshipResponse,
      });
    });

    it("error thrown from an unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockRejectedValue("Thrown Error");
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toHaveBeenCalledTimes(1);
      expect(sponsor).toHaveBeenCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
        error: "Thrown Error",
      });
    });
  });
});
