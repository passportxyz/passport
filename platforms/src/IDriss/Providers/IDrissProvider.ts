// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Verify signed message with ethers
import { JsonRpcProvider, JsonRpcSigner, StaticJsonRpcProvider } from "@ethersproject/providers";

// ----- Ethers library
import { Contract } from "ethers";
import { formatUnits } from "@ethersproject/units";


/*
IDriss Membership Possession Provider can be used to check if an address is the holder of an IDriss Membership NFT (Galxe).
The balance of this NFT is either 0 or 1. The return value of verify() 
therefore is true for 1 (address owns NFT) and false for 0 (address does not own NFT).
*/

// GALXE Membership NFT abi and contract address
const MEMBERSHIP_ABI: any = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
const MEMBERSHIP_ADDRESS = "0xDc18cA55e22f622c0E451D1A792B21F145Cbd058";

// set the network rpc url based on env
export const RPC_URL = "https://poly-rpc.gateway.pokt.network";

// create rpc provider with polygon rpc
const getRPCProvider = (payload: RequestPayload): StaticJsonRpcProvider => {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);

  return provider;
};

export async function getNFTBalance(address: string, payload: RequestPayload): Promise<number> {
  // define a provider using the rpc url
  const staticProvider = getRPCProvider(payload);
  // load Token contract
  const readContract = new Contract(MEMBERSHIP_ADDRESS, MEMBERSHIP_ABI, staticProvider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const nftBalance: string = await readContract?.balanceOf(address);
  // NFT has 0 decimals
  const balanceFormatted: string = formatUnits(nftBalance, 0);
  return parseInt(balanceFormatted);
}

export type nftPossessionProviderOptions = {
  threshold: number;
  contractAddress: string;
  error: string;
};

// Export an IDriss Membership Posession Provider
export class IDrissProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "IDriss";

  // Options can be set here and/or via the constructor
  _options: nftPossessionProviderOptions = {
    threshold: 1,
    contractAddress: "0xDc18cA55e22f622c0E451D1A792B21F145Cbd058",
    error: "NFT Possession Provider Error",
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    let valid = false;
    let amount = 0;

    try {
      amount = await getNFTBalance(address, payload);
    } catch (e) {
      return {
        valid: false,
        error: [this._options.error],
      };
    } finally {
      valid = amount >= this._options.threshold;
    }
    return {
      valid,
      record: valid
        ? {
            address: address,
          }
        : {},
    };
  }
}
