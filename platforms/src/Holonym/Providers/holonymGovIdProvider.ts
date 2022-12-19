// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { AlchemyProvider } from "@ethersproject/providers";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const GOV_ID_SR_ADDRESS = "0x3497556f7D0bF602D4237Ecb8ae92840D09E4f63";

// ABI for Holonym Sybil resistance contract based on government ID
const GOV_ID_SR_ABI = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "isUniqueForAction",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const actionId = 123456789;

export class HolonymGovIdProvider implements Provider {
  // Give the provider a type so that we can select it from a payload
  type = "HolonymGovIdProvider";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address defined in the payload has proven uniqueness using Holonym
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = await getAddress(payload);

    try {
      // define a provider using the alchemy api key
      const provider: AlchemyProvider = new AlchemyProvider("optimism", ALCHEMY_API_KEY);

      const contract = new Contract(GOV_ID_SR_ADDRESS, GOV_ID_SR_ABI, provider);

      // Query contract for user's uniqueness
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const valid: boolean = await contract.isUniqueForAction(address, actionId);

      return {
        valid,
        record: valid
          ? {
              // store the address into the proof records
              address,
              holonym: `Is unique for action ${actionId}, based on government ID`,
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
