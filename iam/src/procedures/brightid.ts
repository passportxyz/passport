import { verifyContextId, sponsor } from "brightid_sdk";
import { BrightIdProcedureResponse, BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "@dpopp/types";

// --- app name for Bright Id App
const CONTEXT = "Gitcoin";

export const verifyBrightidContextId = async (contextIdData: string): Promise<BrightIdProcedureResponse> => {
  const contextId = encodeURIComponent(contextIdData);

  try {
    const verifyContextIdResult: BrightIdVerificationResponse = (await verifyContextId(
      CONTEXT,
      contextId
    )) as BrightIdVerificationResponse;

    return { valid: "contextIds" in verifyContextIdResult, result: verifyContextIdResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};

export const triggerBrightidSponsorship = async (contextIdData: string): Promise<BrightIdProcedureResponse> => {
  const contextId = encodeURIComponent(contextIdData);

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
