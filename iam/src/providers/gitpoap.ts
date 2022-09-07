// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { DateTime } from "luxon";

// Use GitPOAP Public API to get a list of tokens for that address
const GITPOAP_API_URL = "https://public-api.gitpoap.io";

// GitPOAP Public API return type
export type GitPOAP = {
  gitPoapId: number;
  name: string;
  year: number;
  description: string;
  repositories: string[];
  earnedAt: string;
  mintedAt: string;
};

export class GitPOAPProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "GitPOAP";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in owns at least one GitPOAP older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address;
    let valid = false;
    let gitpoaps: GitPOAP[] = [];

    try {
      const { data } = await axios.get<GitPOAP[]>(`${GITPOAP_API_URL}/v1/address/${address}/gitpoaps`, {
        headers: { "Content-Type": "application/json" },
      });
      gitpoaps = data;

      /* Check if address has any GitPOAPs */
      valid = gitpoaps.length > 0;
    } catch (err) {
      return {
        valid: false,
      };
    }

    const gitpoapIds = gitpoaps.map((gitpoap) => gitpoap.gitPoapId);

    return {
      valid,
      record: {
        gitpoaps: valid && gitpoapIds ? gitpoapIds.join(",") : undefined,
      },
    };
  }
}
