// ----- Types
import { Provider, ProviderExternalVerificationError, ProviderOptions } from "../../types.js";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

interface Profile {
  id: string;
  fullHandle: string;
  ownedBy: string;
}

interface Data {
  ownedHandles: {
    items: Profile[];
  };
}

interface GraphQlResponse {
  data: Data;
}

interface LensProfileResponse {
  valid: boolean;
  handle?: string;
  errors: string[];
}

const lensApiEndpoint = "https://api-v2.lens.dev/";

async function getLensProfile(userAddress: string): Promise<LensProfileResponse> {
  try {
    const query = `
      query OwnedHandles {
        ownedHandles(request: {
          for: "${userAddress}"
        }) {
          items {
            id
            ownedBy
            fullHandle
          }
        }
      }
    `;
    const result: { data: GraphQlResponse } = await axios.post(lensApiEndpoint, {
      query,
    });

    const handles = result?.data?.data?.ownedHandles?.items;

    const validHandle = handles?.find(
      (handle) => handle.ownedBy.toLocaleLowerCase() === userAddress.toLocaleLowerCase()
    );

    if (validHandle) {
      return {
        valid: true,
        handle: validHandle.fullHandle,
        errors: [],
      };
    } else {
      return {
        valid: false,
        errors: ["We were unable to retrieve a Lens handle for your address."],
      };
    }
  } catch (error) {
    handleProviderAxiosError(error, "Lens profile check error", [userAddress]);
  }
}

// Export a Lens Profile Provider
export class LensProfileProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Lens";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has a lens handle
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      // if a signer is provider we will use that address to verify against
      const address = payload.address.toString().toLowerCase();
      let record = undefined;
      let errors: string[] = [];
      const { valid, handle, errors: lensErrors } = await getLensProfile(address);

      if (valid === true) {
        record = { handle };
      } else {
        errors = lensErrors;
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e) {
      throw new ProviderExternalVerificationError(`Error verifying Snapshot proposals: ${JSON.stringify(e)}.`);
    }
  }
}
