// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

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
): Promise<{ isMember: boolean; identifier: string; error?: string }> => {
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
    isMember = result.data.data.checkVerifiedOrganizationMember.isVerifiedOrganizationMember;
    identifier = result.data.data.checkVerifiedOrganizationMember.uniqueIdentifier;
    return {
      isMember,
      identifier,
    };
  } catch (e: unknown) {
    handleProviderAxiosError(e, "cyberconnect org member check", [address]);
    return {
      isMember: false,
      identifier: "",
      error: result?.data?.errors[0]?.message || "An unknown error occurred",
    };
  }
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
    const errors = [];
    let valid = false,
      record = {};

    try {
      const address = payload.address.toString().toLowerCase();
      const { isMember, identifier, error } = await checkForOrgMember(cyberconnectGraphQL, address);

      valid = isMember ? true : false;

      if (valid === true) {
        record = {
          orgMembership: identifier,
        };
      } else {
        errors.push("We determined that you are not a member of CyberConnect, which disqualifies you for this stamp.");
      }

      if (!valid && error) {
        errors.push(error);
      }

      return Promise.resolve({
        valid,
        record,
        errors,
      });
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(
        `CyberProfile provider check organization membership error: ${JSON.stringify(e)}`
      );
    }
  }
}
