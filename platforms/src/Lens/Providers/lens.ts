// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

interface DefaultProfile {
  id: string;
  handle: string;
}

interface Data {
  defaultProfile: DefaultProfile;
}

interface GraphQlResponse {
  data: Data;
}

const lensApiEndpoint = "https://api.lens.dev";

async function getLensProfile(userAddress: string): Promise<string> {
  const query = `
    query DefaultProfile {
      defaultProfile(request: { ethereumAddress: "${userAddress}"}) {
        id
        handle
      }
    }
  `;
  const result: { data: GraphQlResponse } = await axios.post(lensApiEndpoint, {
    query,
  });

  return result?.data?.data?.defaultProfile?.handle;
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
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let handle: string;
    try {
      handle = await getLensProfile(address);
    } catch (e) {
      return {
        valid: false,
        error: ["Lens provider get user handle error"],
      };
    }
    valid = !!handle;
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            handle,
          }
        : {},
    });
  }
}
