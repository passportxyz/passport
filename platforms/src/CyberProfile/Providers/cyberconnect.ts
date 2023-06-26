// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract, BigNumber } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// CyberProfile Proxy Contract Address
const CYBERPROFILE_PROXY_CONTRACT_ADDRESS = "0x2723522702093601e6360CAe665518C4f63e9dA6";

// CyberProfile Proxy ABI functions needed to get the length of primary profile handle
const CYBERPROFILE_PROXY_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getPrimaryProfile",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "profileId", type: "uint256" }],
    name: "getHandleByProfileId",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// return 0 if no primary handle is found, otherwise return the length of the primary handle
async function getLengthOfPrimaryHandle(userAddress: string): Promise<number> {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(
    process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/"
  );

  const contract = new Contract(CYBERPROFILE_PROXY_CONTRACT_ADDRESS, CYBERPROFILE_PROXY_ABI, provider);
  // get primary profile id
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const profileId: BigNumber = await contract.getPrimaryProfile(userAddress);
  // if no primary profile id is found (profileId == 0), return 0
  if (profileId.isZero()) {
    return 0;
  }
  // get primary profile handle
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const handle: string = await contract.getHandleByProfileId(profileId.toNumber());
  // return the length of the primary handle
  return handle.length;
}

// Export a CyberProfilePremiumProvider
export class CyberProfilePremiumProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CyberProfilePremium";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has a handle length <= 6 and > 0
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let lengthOfPrimaryHandle: number;
    try {
      lengthOfPrimaryHandle = await getLengthOfPrimaryHandle(address);
    } catch (e) {
      return {
        valid: false,
        error: ["CyberProfile provider get user primary handle error"],
      };
    }
    valid = lengthOfPrimaryHandle <= 6 && lengthOfPrimaryHandle > 0;
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

// Export a CyberProfilePaidProvider
export class CyberProfilePaidProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CyberProfilePaid";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has a handle length <= 12 and > 6
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let lengthOfPrimaryHandle: number;
    try {
      lengthOfPrimaryHandle = await getLengthOfPrimaryHandle(address);
    } catch (e) {
      return {
        valid: false,
        error: ["CyberProfile provider get user primary handle error"],
      };
    }
    valid = lengthOfPrimaryHandle <= 12 && lengthOfPrimaryHandle > 6;
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
