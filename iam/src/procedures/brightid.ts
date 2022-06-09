import { verifyContextId, sponsor } from "brightid_sdk";
import {
  BrightIdProcedureResponse,
  BrightIdVerificationResponse,
  BrightIdSponsorshipResponse,
} from "@gitcoin/passport-types";

// --- app name for Bright Id App
const CONTEXT = "Gitcoin";

export const verifyBrightidContextId = async (contextId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const verifyContextIdResult: BrightIdVerificationResponse = (await verifyContextId(
      CONTEXT,
      contextId
    )) as BrightIdVerificationResponse;

    // Unique is true if the user obtained "Meets" verification by attending a connection party
    const isUnique = "unique" in verifyContextIdResult && verifyContextIdResult.unique === true;
    const isValid = "contextIds" in verifyContextIdResult && verifyContextIdResult.contextIds.length > 0;

    return { valid: isValid && isUnique, result: verifyContextIdResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};

export const triggerBrightidSponsorship = async (contextId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const sponsorResult: BrightIdSponsorshipResponse = (await sponsor(
      process.env.BRIGHTID_PRIVATE_KEY,
      CONTEXT,
      contextId
    )) as BrightIdSponsorshipResponse;

    return { valid: sponsorResult.status === "success", result: sponsorResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};
