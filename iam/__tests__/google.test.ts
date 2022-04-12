
// ---- Test subject
import { RequestPayload } from "@dpopp/types";
import { GoogleProvider } from "../src/providers/google";

jest.mock('google-auth-library');

import { OAuth2Client } from "google-auth-library";

const OAuth2ClientMock = jest
  .spyOn(OAuth2Client.prototype, 'verifyIdToken')
  .mockImplementation(() => {

    return {
        getPayload: jest.fn(() => ({
            "email": "test",
            "email_verified": "test"
        }))
    }
  }); 

describe("Attempt verification", function () {
    it("handles valid verification attempt", async () => {
        const google = new GoogleProvider();

        google.verify({
            proofs: {
                tokenId: "test"
            }
        } as unknown as RequestPayload)

        expect(OAuth2ClientMock).toBeCalledWith({idToken: "test", audience: process.env.GOOGLE_CLIENT_ID})
    });
});