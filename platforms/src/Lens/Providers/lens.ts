// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract, BigNumber } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// Lens Hub Proxy Contract Address
const LENS_HUB_PROXY_CONTRACT_ADDRESS = "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";

// Lens Hub Proxy ABI functions needed to get the handle
const LENS_HUB_PROXY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "wallet",
        type: "address",
      },
    ],
    name: "defaultProfile",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "profileId",
        type: "uint256",
      },
    ],
    name: "getHandle",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// async function getDefaultProfile(userAddress: string): Promise<string> {
//   const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(process.env.POLYGON_RPC_URL);

//   const contract = new Contract(LENS_HUB_PROXY_CONTRACT_ADDRESS, LENS_HUB_PROXY_ABI, provider);

//   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//   const profileId: unknown = await contract.defaultProfile(userAddress);

//   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//   const userHandle: unknown = await contract.getHandle(profileId);

//   return userHandle?.toString();
// }

// If the user owns a lens handle this will return a number greater than 0
async function getNumberOfHandles(userAddress: string): Promise<number> {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(process.env.POLYGON_RPC_URL);
  const contract = new Contract(LENS_HUB_PROXY_CONTRACT_ADDRESS, LENS_HUB_PROXY_ABI, provider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const numberOfHandles: BigNumber = await contract.balanceOf(userAddress);
  return numberOfHandles?._isBigNumber ? parseInt(numberOfHandles?._hex, 16) : 0;
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
    let numberOfHandles: number;
    try {
      numberOfHandles = await getNumberOfHandles(address);
    } catch (e) {
      return {
        valid: false,
        error: ["Lens provider get user handle error"],
      };
    }
    valid = numberOfHandles >= 1;
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
            numberOfHandles: numberOfHandles.toString(),
          }
        : {},
    });
  }
}
