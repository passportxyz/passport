// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract, BigNumber, utils } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// Proof of humanity contract address
const STAKING_CONTRACT_ADDRESS = "0x3A0E4ef9f955eB70D84fD96ccD642dB3868d7872";

// Proof of humanity Contract ABI
const STAKING_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getStakeFor",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "locked",
            type: "bool",
          },
        ],
        internalType: "struct IStaking.Stake",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// set the network rpc url based on env
export const RPC_URL = process.env.GOERLI_RPC_URL;

// Export a Poh Provider to carry out Proof of Humanity account is registered and active check and return a record object
export class IdStakingProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "IdStaking";
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
      const readContract = new Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);

      // Checks to see if the address is registered with proof of humanity
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const stakeAmount: any = await readContract.getStakeFor(address);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
      const stakeAmountFormatted: string = utils.formatUnits(stakeAmount.balance.toString(), 18);

      const valid: boolean = parseFloat(stakeAmountFormatted) >= 20.0;

      return {
        valid,
        record: {
          // pass stake amount
          stakeAmount: stakeAmountFormatted,
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}
