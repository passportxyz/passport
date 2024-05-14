import axios from "axios";

type OutdidVerificationResponse = { successRedirect: string, verificationID: string, userDid?: string };

export const outdidRequestVerification = async (userDid: string, redirect: string): Promise<OutdidVerificationResponse> => {
    // request a verification containing a unique user identifier
    return await axios.post(`https://api.outdid.io/v1/verification-request?apiKey=${process.env.OUTDID_API_KEY}&apiSecret=${process.env.OUTDID_API_SECRET}`, {
        verificationParameters: { uniqueness: true },
        verificationType: "icao",
        verificationName: userDid,
        redirect,
    }).then((response: { data: OutdidVerificationResponse }) => {
        return response.data;
    });
}
