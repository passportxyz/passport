// --- Test subject
import { BrightIdProvider } from "../Providers/brightid";
import { triggerBrightidSponsorship } from "../procedures/brightid";
import { BrightIdSponsorshipResponse, BrightIdVerificationResponse } from "@gitcoin/passport-types";
import { RequestPayload } from "@gitcoin/passport-types";
import { userVerificationStatus, sponsor } from "brightid_sdk_v6";

jest.mock("brightid_sdk_v6", () => ({
  userVerificationStatus: jest.fn(),
  sponsor: jest.fn(),
}));

describe("Attempt BrightId", () => {
  const did = "did:pkh:eip155:1:0x0";
  const nonUniqueResponse: BrightIdVerificationResponse = {
    unique: false,
    verification: "verification message",
    app: "Gitcoin",
    appUserId: did,
  };

  const validVerificationResponse: BrightIdVerificationResponse = {
    unique: true,
    verification: "verification message",
    app: "Gitcoin",
    appUserId: did,
  };

  const invalidVerificationResponse: BrightIdVerificationResponse = {
    error: true,
    errorMessage: "Not Found",
  };

  const validSponsorshipResponse: BrightIdSponsorshipResponse = {
    hash: "0xcdDC",
  };

  const invalidSponsorshipResponse: BrightIdSponsorshipResponse = {
    error: true,
    errorMessage: "Not Found",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Handles Verification", () => {
    it("valid BrightId did as contextId verification attempt, returns valid true, verifies if user has Meet status and verified contextId", async () => {
      (userVerificationStatus as jest.Mock).mockResolvedValue(validVerificationResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(userVerificationStatus).toBeCalledTimes(1);
      expect(userVerificationStatus).toBeCalledWith("Gitcoin", did);
      expect(result).toMatchObject({
        valid: true,
        record: {
          contextId: "Gitcoin",
          meets: "true",
        },
      });
    });

    it("invalid BrightId did as contextId verification attempt, returns valid false and record undefined", async () => {
      (userVerificationStatus as jest.Mock).mockResolvedValue(invalidVerificationResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(userVerificationStatus).toBeCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
        record: undefined,
      });
    });

    it("thrown error from BrightId did as contextId verification attempt, returns valid false", async () => {
      (userVerificationStatus as jest.Mock).mockRejectedValue("Thrown Error");

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(userVerificationStatus).toBeCalledTimes(1);
      expect(result).toMatchObject({
        valid: false,
      });
    });

    it("user is sponsored but did not attend a connection party, returns valid false and record undefined", async () => {
      (userVerificationStatus as jest.Mock).mockResolvedValue(nonUniqueResponse);

      const result = await new BrightIdProvider().verify({
        proofs: {
          did,
        },
      } as unknown as RequestPayload);

      expect(userVerificationStatus).toBeCalledTimes(1);
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
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: true,
        result: validSponsorshipResponse,
      });
    });

    it("unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockResolvedValue(invalidSponsorshipResponse);
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toBeCalledTimes(1);
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
      });
    });

    it("error thrown from an unsuccessful attempt", async () => {
      (sponsor as jest.Mock).mockRejectedValue("Thrown Error");
      const result = await triggerBrightidSponsorship(did);

      expect(sponsor).toBeCalledTimes(1);
      expect(sponsor).toBeCalledWith(process.env.BRIGHTID_PRIVATE_KEY || "", "Gitcoin", did);
      expect(result).toMatchObject({
        valid: false,
        error: "Thrown Error",
      });
    });
  });
});
