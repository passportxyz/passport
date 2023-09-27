// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { parseUnits } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

// ----- RPC Getter
import { getRPCProvider } from "../../utils/signer";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
/*
Eth ERC20 Possession Provider can be used to check a greater than balance for ethereum or any other evm token (ERC20).
By default this will verify the ethereum balance for the address in the parameter. To customize the
token set the contract_address or decimal number in the options passed to the class. The default decimal number for formatting
is 18.
*/

// ERC20 ABI
const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

type EthErc20Context = ProviderContext & {
  ethErc20?: {
    counts?: {
      eth?: BigNumber;
      [tokenAddress: string]: BigNumber;
    };
  };
};

type Erc20Contract = Contract & {
  balanceOf: (address: string) => Promise<BigNumber>;
};

// set the network rpc url based on env
export const RPC_URL = process.env.RPC_URL;

export async function getTokenBalance(
  address: string,
  tokenContractAddress: string,
  payload: RequestPayload,
  context: EthErc20Context
): Promise<BigNumber> {
  if (context.ethErc20?.counts?.[tokenContractAddress] === undefined) {
    // define a provider using the rpc url
    const staticProvider = getRPCProvider(payload);
    // load Token contract
    const readContract = new Contract(tokenContractAddress, ERC20_ABI, staticProvider) as Erc20Contract;
    const tokenBalance = await readContract?.balanceOf(address);

    if (!context.ethErc20) {
      context.ethErc20 = {};
    }
    if (!context.ethErc20.counts) {
      context.ethErc20.counts = {};
    }
    context.ethErc20.counts[tokenContractAddress] = tokenBalance;
  }
  return context.ethErc20.counts[tokenContractAddress];
}

export async function getEthBalance(
  address: string,
  payload: RequestPayload,
  context: EthErc20Context
): Promise<BigNumber> {
  if (context.ethErc20?.counts?.eth === undefined) {
    // define a provider using the rpc url
    const staticProvider = getRPCProvider(payload);
    const ethBalance = await staticProvider?.getBalance(address);

    if (!context.ethErc20) {
      context.ethErc20 = {};
    }
    if (!context.ethErc20.counts) {
      context.ethErc20.counts = {};
    }
    context.ethErc20.counts.eth = ethBalance;
  }
  return context.ethErc20.counts.eth;
}

export type EthErc20PossessionProviderOptions = {
  threshold: string;
  recordAttribute: string;
  contractAddress: string;
  decimalNumber: number;
  error: string;
};

// Export an Eth ERC20 Possessions Provider. This is intended to be a generic implementation that should be extended
export class EthErc20PossessionProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options: EthErc20PossessionProviderOptions = {
    threshold: "1",
    recordAttribute: "",
    contractAddress: "",
    decimalNumber: 18,
    error: "Eth Possession Provider Error",
  };

  // construct the provider instance with supplied options
  constructor(options: Partial<EthErc20PossessionProviderOptions> = {}) {
    this._options = { ...this._options, ...options };
    this.type = `${this._options.recordAttribute}#${this._options.threshold}`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: EthErc20Context): Promise<VerifiedPayload> {
    try {
      const { address } = payload;
      let valid = false,
        record = undefined;
      let amount: BigNumber = BigNumber.from("0");
      const errors: string[] = [];

      if (this._options.contractAddress.length > 0) {
        amount = await getTokenBalance(address, this._options.contractAddress, payload, context);
      } else {
        amount = await getEthBalance(address, payload, context);
      }

      const bnThreshold = parseUnits(this._options.threshold, this._options.decimalNumber);
      if (BigNumber.isBigNumber(amount)) {
        valid = amount.gte(bnThreshold);
        if (valid === true) {
          record = {
            // store the address into the proof records
            address,
            [this._options.recordAttribute]: `${this._options.threshold}`,
          };
        } else {
          errors.push(`You do not hold the required amount of ETH for this stamp. Your ETH: ${String(amount)}.`);
        }
      } else {
        errors.push(this._options.error);
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error validating ETH amounts: ${String(e)}`);
    }
  }
}
