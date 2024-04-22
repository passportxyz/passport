import axios from "axios";

type OutdidVerificationResponse = { successRedirect: string, requestID: string, userDid?: string };

export const outdidRequestVerification = async (userDid: string, redirect: string): Promise<OutdidVerificationResponse> => {
    // request a verification containing a unique user identifier
    return await axios.post(`https://api.outdid.io/verification-request?apiKey=${process.env.OUTDID_API_KEY}&apiSecret=${process.env.OUTDID_API_SECRET}`, {
        verificationParameters: { uniqueness: true },
        verificationType: "icao",
        verificationName: userDid,
        redirect,
    }).then((response: { data: OutdidVerificationResponse }) => {
        return response.data;
    });
}
