// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

export const cyberconnectGraphQL = "https://api.cyberconnect.dev/";

// Defining interfaces for the data structure returned by the gql query
interface CheckOrgMemberResponse {
  data: {
    data?: {
      checkVerifiedOrganizationMember?: boolean;
    };
  };
}

export const checkForOrgMember = async (url: string, address: string): Promise<boolean> => {
  let isMember = false;
  let result: CheckOrgMemberResponse;

  // Query the CyberConnect graphQL
  try {
    result = await axios.post(url, {
      query: `
        query CheckOrgMember {
          checkVerifiedOrganizationMember (
            address: "${address}"
          )
        }`,
    });
  } catch (e: unknown) {
    const error = e as { errors: { message: string } };
    throw `The following error is being thrown: ${error.errors.message}`;
  }

  isMember = result.data.data.checkVerifiedOrganizationMember;
  return isMember;
};

// Export a CyberProfileOrgMemberProvider
export class CyberProfileOrgMemberProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CyberProfileOrgMember";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has a handle length > 12
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let isMember: boolean;
    try {
      isMember = await checkForOrgMember(cyberconnectGraphQL, address);
    } catch (e) {
      return {
        valid: false,
        error: ["CyberProfile provider check organization membership error"],
      };
    }
    valid = isMember ? true : false;
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
          }
        : {},
    });
  }
}
