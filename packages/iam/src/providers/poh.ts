// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// Proof of humanity contract address
const POH_CONTRACT_ADDRESS = "0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb";

// Proof of humanity Contract ABI
const POH_ABI = [
  {
    constant: true,
    inputs: [{ internalType: "address", name: "_submissionID", type: "address" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

// set the network rpc url based on env
export const RPC_URL = process.env.RPC_URL;

// Export a Poh Provider to carry out Proof of Humanity account is registered and active check and return a record object
export class PohProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Poh";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    try {
      // define a provider using the rpc url
      const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);

      // load Proof of humanity contract
      const readContract = new Contract(POH_CONTRACT_ADDRESS, POH_ABI, provider);

      // Checks to see if the address is registered with proof of humanity
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const valid: boolean = await readContract.isRegistered(address);

      return {
        valid,
        record: valid
          ? {
              // store the address into the proof records
              address,
            }
          : undefined,
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}
