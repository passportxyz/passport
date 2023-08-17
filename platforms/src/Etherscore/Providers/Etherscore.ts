// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { ethers } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

const ETHERSCORE_CONTRACT_ADDRESS = "0xEa072EB2c7FBC875DcB1B58F240fAF8755399f7e";

export const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;

// ETHERSCORE ABI functions needed to get the balance of badges holded
const ETHERSCORE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
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
];

export const getNumberOfBadges = async (userAddress: string): Promise<number> => {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(MUMBAI_RPC_URL);
  const contract = new ethers.Contract(ETHERSCORE_CONTRACT_ADDRESS, ETHERSCORE_ABI, provider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const numberOfBadgesHexa: string = await contract.balanceOf(userAddress);
  const numberOfBadges: number = parseInt(numberOfBadgesHexa, 16);
  return numberOfBadges;
};

export class BadgesAmountProvider implements Provider {
  type: string;
  badgeCondition: number;

  _options = {};

  constructor(type: string, badgeCondition: number, options: ProviderOptions = {}) {
    this.type = type;
    this.badgeCondition = badgeCondition;
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let numberOfBadges: number;
    try {
      numberOfBadges = await getNumberOfBadges(address);
    } catch (e) {
      return {
        valid: false,
        error: [`${this.type} provider get user handle error`],
      };
    }

    valid = numberOfBadges >= this.badgeCondition;

    return {
      valid: valid,
      record: valid
        ? {
            address: address,
            numberOfBadges: numberOfBadges.toString(),
          }
        : {},
    };
  }
}

export class EtherscoreBronzeProvider extends BadgesAmountProvider {
  constructor(options: ProviderOptions = {}) {
    super("EtherscoreBronze", 10, options);
  }
}

export class EtherscoreSilverProvider extends BadgesAmountProvider {
  constructor(options: ProviderOptions = {}) {
    super("EtherscoreSilver", 20, options);
  }
}

export class EtherscoreGoldProvider extends BadgesAmountProvider {
  constructor(options: ProviderOptions = {}) {
    super("EtherscoreGold", 30, options);
  }
}
