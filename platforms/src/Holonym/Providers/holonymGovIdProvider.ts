// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { AlchemyProvider } from "@ethersproject/providers";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const GOV_ID_SR_ADDRESS = "0xdD748977BAb5782625AF1466F4C5F02Eb92Fce31";

// ABI for Holonym Sybil resistance contract based on government ID
const GOV_ID_SR_ABI = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "isUniqueForAction",
    outputs: [{ internalType: "bool", name: "unique", type: "bool" }],
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
    const address = (await getAddress(payload)).toLowerCase();
    const errors = [];
    let record = undefined,
      valid = false;

    try {
      // define a provider using the alchemy api key
      const provider: AlchemyProvider = new AlchemyProvider("optimism", ALCHEMY_API_KEY);

      const contract = new Contract(GOV_ID_SR_ADDRESS, GOV_ID_SR_ABI, provider);

      // Query contract for user's uniqueness
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      valid = await contract.isUniqueForAction(address, actionId);

      if (valid) {
        record = {
          // store the address into the proof records
          address,
        };
      } else {
        errors.push(
          `We were unable to verify that your address was unique for action -- isUniqueForAction: ${String(valid)}.`
        );
      }

      if (!valid && errors.length === 0) {
        errors.push("We are unable to determine the error at this time.");
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Holonym Government ID verification failure: ${JSON.stringify(e)}.`);
    }
  }
}
