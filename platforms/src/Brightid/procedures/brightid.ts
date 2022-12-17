import { userVerificationStatus, sponsor } from "brightid_sdk_v6";
import {
  BrightIdProcedureResponse,
  BrightIdVerificationResponse,
  BrightIdSponsorshipResponse,
} from "@gitcoin/passport-types";

// --- app name for Bright Id App
const CONTEXT = "Gitcoin";

export const verifyBrightidContextId = async (contextId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const verifyContextIdResult: BrightIdVerificationResponse = (await userVerificationStatus(
      CONTEXT,
      contextId
    )) as BrightIdVerificationResponse;
    // Unique is true if the user obtained "Meets" verification by attending a connection party
    const isUnique = "unique" in verifyContextIdResult && verifyContextIdResult.unique === true;
    // TODO: Possibly verify verification further
    const isValid = "verification" in verifyContextIdResult && verifyContextIdResult.verification;

    return { valid: (isValid && isUnique) || false, result: verifyContextIdResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};

export const triggerBrightidSponsorship = async (contextId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const sponsorResult: BrightIdSponsorshipResponse = (await sponsor(
      process.env.BRIGHTID_PRIVATE_KEY || "",
      CONTEXT,
      contextId
    )) as BrightIdSponsorshipResponse;

    return { valid: sponsorResult.status === "success", result: sponsorResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};
