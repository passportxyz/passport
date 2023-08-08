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
      checkVerifiedOrganizationMember?: {
        isVerifiedOrganizationMember: boolean;
        uniqueIdentifier: string;
      };
    };
    errors?: {
      message: string;
    }[];
  };
}

export const checkForOrgMember = async (
  url: string,
  address: string
): Promise<{ isMember: boolean; identifier: string }> => {
  let isMember = false;
  let identifier = "";
  let result: CheckOrgMemberResponse;

  // Query the CyberConnect graphQL
  try {
    result = await axios.post(url, {
      query: `
        query CheckOrgMember {
          checkVerifiedOrganizationMember (
            address: "${address}"
          )
          {
            isVerifiedOrganizationMember
            uniqueIdentifier
          }
        }`,
    });
    if (result.data.errors) {
      throw result.data.errors[0].message;
    }
  } catch (e: unknown) {
    throw `The following error is being thrown: ${JSON.stringify(e)}`;
  }

  isMember = result.data.data.checkVerifiedOrganizationMember.isVerifiedOrganizationMember;
  identifier = result.data.data.checkVerifiedOrganizationMember.uniqueIdentifier;
  return {
    isMember,
    identifier,
  };
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
    try {
      const { isMember, identifier } = await checkForOrgMember(cyberconnectGraphQL, address);
      valid = isMember ? true : false;
      return Promise.resolve({
        valid: valid,
        record: valid
          ? {
              orgMembership: identifier,
            }
          : {},
      });
    } catch (e) {
      return {
        valid: false,
        error: ["CyberProfile provider check organization membership error"],
      };
    }
  }
}
