// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

// --- Api Library
import make from "axios";

type FacebookResponse = {
  data?: Array<unknown>;
  next?: { path?: string };
  previous?: { path?: string };
  paging?: { next: string; previous: string };
  access_token?: string;
};

type FacebookDebugResponse = {
  app_id?: string;
  type?: string;
  application?: string;
  data_access_expires_at?: number;
  expires_at?: number;
  is_valid?: boolean;
  scopes?: string[];
  user_id?: string;
};

// Facebook Graph API call response
type Response = {
  data?: FacebookDebugResponse;
  status?: number;
  statusText?: string;
  headers?: {
    [key: string]: string;
  };
};

// Query Facebook graph api to verify the access token recieved from the user login is valid
export class FacebookProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Facebook";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    try {
      const responseData = await verifyFacebook(payload.proofs.accessToken);
      console.log("responseData ", responseData.data);
      const formattedData = responseData?.data;
      /// TODO: What should we verify?
      if (formattedData.is_valid && formattedData.user_id) {
        valid = true;
      }
    } catch (e) {
      return { valid: false };
    } finally {
      valid;
    }

    return {
      valid: valid,
      record: {
        email: "Facebook",
      },
    };
  }
}

async function verifyFacebook(accessToken: string): Promise<Response> {
  try {
    const response: Response = await make({
      headers: { "User-Agent": "Facebook Graph Client" },
      method: "GET",
      params: Object.assign({ access_token: accessToken, input_token: accessToken }),
      url: "https://graph.facebook.com/debug_token/",
    });
    return response;
  } catch (error) {
    console.log("Get ERROR: ", error);
  }
}
