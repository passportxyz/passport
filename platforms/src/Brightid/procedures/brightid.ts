/* eslint-disable @typescript-eslint/no-unsafe-call */
import { userVerificationStatus, sponsor } from "brightid_sdk_v6";
import { BrightIdProcedureResponse, BrightIdSponsorshipResponse, SignedVerification } from "@gitcoin/passport-types";

// --- app name for Bright Id App
const CONTEXT = "Gitcoin";

export const verifyBrightidContextId = async (contextId: string): Promise<BrightIdProcedureResponse> => {
  try {
    const verifyContextIdResult = (await userVerificationStatus(CONTEXT, contextId)) as SignedVerification;
    // Unique is true if the user obtained "Meets" verification by attending a connection party
    const isUnique = "unique" in verifyContextIdResult && verifyContextIdResult.unique === true;
    // Response reference https://dev.brightid.org/docs/node-api/3e6b0acc7fe6b-gets-a-signed-verification
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

    if ("error" in sponsorResult && sponsorResult.error) {
      return { valid: false, error: sponsorResult.errorMessage };
    }

    return { valid: true, result: sponsorResult };
  } catch (err: unknown) {
    return { valid: false, error: err as string };
  }
};
