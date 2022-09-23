// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { formatUnits } from "@ethersproject/units";

// utils
import { getRPCProvider } from "../utils/signer";

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

export async function getTokenBalance(
  address: string,
  tokenContractAddress: string,
  decimalNumber: number,
  payload: RequestPayload
): Promise<number> {
  // define a provider using the rpc url
  const provider = getRPCProvider(payload);
  // load Token contract
  const readContract = new Contract(tokenContractAddress, ERC20_ABI, provider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const tokenBalance: string = await readContract?.balanceOf(address);
  const balanceFormatted: string = formatUnits(tokenBalance, decimalNumber);
  return parseFloat(balanceFormatted);
}

export async function getEthBalance(address: string, payload: RequestPayload): Promise<number> {
  // define a provider using the rpc url
  const provider = getRPCProvider(payload);
  const ethBalance = await provider?.getBalance(address);
  // convert a currency unit from wei to ether
  const balanceFormatted: string = formatUnits(ethBalance, 18);
  return parseFloat(balanceFormatted);
}

export type ethErc20PossessionProviderOptions = {
  threshold: number;
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
  _options: ethErc20PossessionProviderOptions = {
    threshold: 1,
    recordAttribute: "",
    contractAddress: "",
    decimalNumber: 18,
    error: "Coin Possession Provider Error",
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = `${this._options.recordAttribute}#${this._options.threshold}`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    let valid = false;
    let amount = 0;
    const currentAddress = payload?.signer?.address ?? address;
    try {
      if (this._options.contractAddress.length > 0) {
        amount = await getTokenBalance(
          currentAddress,
          this._options.contractAddress,
          this._options.decimalNumber,
          payload
        );
      } else {
        amount = await getEthBalance(currentAddress, payload);
      }
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
            // store the address into the proof records
            address,
            [this._options.recordAttribute]: `${this._options.threshold}`,
          }
        : {},
    };
  }
}
