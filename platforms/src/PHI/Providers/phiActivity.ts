// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

// subgraphs to check
export const phiSubgraphs = ["https://api.thegraph.com/subgraphs/name/zak3939/phiclaimcontract"];

// Defining interfaces for the data structure returned by the subgraph
interface Record {
  tokenid: string;
  blockNumber: string;
}

interface LogClaimObject {
  logClaimObject: Record[];
}

interface Data {
  data: LogClaimObject;
}

interface Result {
  data: Data;
}

type PhiCheckResult = {
  hasClaimed: boolean;
  phiquestList: string[];
};

// Export a PHIActivitySilver Provider
export class PHIActivitySilverProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "PHIActivitySilver";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload owns at least one Silver Rank Object
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();

    let phiCheckResult = {
      hasClaimed: false,
      phiquestList: null as string[],
    };

    async function checkForPHIActivity(url: string): Promise<PhiCheckResult> {
      let hasClaimed = false;
      let phiquestList = null as string[];
      const result = await axios.post(url, {
        query: `
          {
            logClaimObjects(
              where: {tokenid_in: [100161,100162,100163,100164,100165], sender: "${address}"}
            ) {
              tokenid
              blockNumber
            }
          }
          `,
      });

      const r = result as Result;
      const records = r?.data?.data?.logClaimObject || [];

      if (records.length > 0) {
        hasClaimed = true;
        phiquestList = records.map((record) => record.tokenid);
      }

      // Return false by default (if tokens array is empty or no matching verification)
      return {
        hasClaimed,
        phiquestList,
      };
    }
    phiCheckResult = await checkForPHIActivity(phiSubgraphs[0]);

    return Promise.resolve({
      valid: phiCheckResult.hasClaimed,
      record: {
        address: phiCheckResult.hasClaimed ? address : undefined,
      },
    });
  }
}

// Export a PHIActivityGold Provider
export class PHIActivityGoldProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "PHIActivityGold";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload owns at least one Gold Rank Object
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();

    let phiCheckResult = {
      hasClaimed: false,
      phiquestList: null as string[],
    };

    async function checkForPHIActivity(url: string): Promise<PhiCheckResult> {
      let hasClaimed = false;
      let phiquestList = null as string[];
      const result = await axios.post(url, {
        query: `
          {
            logClaimObjects(
              where: {tokenid_in: [100166,100167,100168,100169,100170], sender: "${address}"}
            ) {
              tokenid
              blockNumber
            }
          }
          `,
      });

      const r = result as Result;
      const records = r?.data?.data?.logClaimObject || [];

      if (records.length > 0) {
        hasClaimed = true;
        phiquestList = records.map((record) => record.tokenid);
      }

      // Return false by default (if tokens array is empty or no matching verification)
      return {
        hasClaimed,
        phiquestList,
      };
    }
    phiCheckResult = await checkForPHIActivity(phiSubgraphs[0]);

    return Promise.resolve({
      valid: phiCheckResult.hasClaimed,
      record: {
        address: phiCheckResult.hasClaimed ? address : undefined,
      },
    });
  }
}
