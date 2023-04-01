import { AppContext, ProviderPayload, Provider, ProviderOptions } from "../types";
import { Platform } from "../utils/platform";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { Contract } from "ethers";
import { formatUnits } from "@ethersproject/units";
// ----- RPC Getter
import { getRPCProvider } from "../utils/signer";

export class CoinpassportPlatform extends Platform {
  platformId = "Coinpassport";
  path = "Coinpassport";
  isEVM = true;
}

const CHAINS = [
  // Check Optimism first because most users publish to Optimism
  { rpc: process.env.OPTIMISM_RPC_URL, contract: "0x247baae25D0c32fdA5CfB902c0d87D47587CF9Da" },
  { rpc: process.env.POLYGON_RPC_URL, contract: "0x637aeabc614e95da58f232e493fca63d09e15b8f" },
  { rpc: process.env.RPC_URL, contract: "0x3827DC9E48B3691B171Bf2F2C6BC3Cab8218AcF6" },
  { rpc: process.env.AVALANCHE_RPC_URL, contract: "0x3827DC9E48B3691B171Bf2F2C6BC3Cab8218AcF6" },
];

const METHODS = [
  {
    inputs: [
      {
        internalType: "address",
        name: "toCheck",
        type: "address",
      },
    ],
    name: "addressExpiration",
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
        internalType: "address",
        name: "toCheck",
        type: "address",
      },
    ],
    name: "getCountryCode",
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
        internalType: "address",
        name: "toCheck",
        type: "address",
      },
    ],
    name: "isOver18",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "toCheck",
        type: "address",
      },
    ],
    name: "isOver21",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
].reduce((out, cur) => {
  out[cur.name] = async function (address: string): Promise<string | number | boolean> {
    for (const chain of CHAINS) {
      if (!chain.rpc) continue;
      const readContract = new Contract(
        chain.contract,
        [cur],
        getRPCProvider({ rpcUrl: chain.rpc } as unknown as RequestPayload)
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const value = (await readContract[cur.name](address)) as string | number | boolean;
      if (value) return value;
    }
  };
  return out;
}, {} as Record<string, (address: string) => Promise<string | number | boolean>>);

const ERROR_STRING = "Coinpassport Provider Error";

export class CoinpassportProvider implements Provider {
  type = "Coinpassport";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    let expiration = "0";
    let valid = false;

    try {
      expiration = (await METHODS.addressExpiration(address)).toString();
    } catch (error) {
      return { valid: false, error: [ERROR_STRING] };
    } finally {
      valid = Number(expiration) >= Math.floor(Date.now() / 1000);
    }

    return {
      valid,
      record: { address, expiration },
    };
  }
}

export class CoinpassportOver18Provider implements Provider {
  type = "CoinpassportOver18";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    let valid = false;

    try {
      valid = !!(await METHODS.isOver18(address));
    } catch (error) {
      return { valid: false, error: [ERROR_STRING] };
    }

    return {
      valid,
      record: { address },
    };
  }
}

export class CoinpassportOver21Provider implements Provider {
  type = "CoinpassportOver21";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    let valid = false;

    try {
      valid = !!(await METHODS.isOver21(address));
    } catch (error) {
      return { valid: false, error: [ERROR_STRING] };
    }

    return {
      valid,
      record: { address },
    };
  }
}

export class CoinpassportCountryProvider implements Provider {
  type = "CoinpassportCountry";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    let valid = false;
    let countryCodeInt = 0;
    let countryCodeStr = "";

    try {
      countryCodeInt = Number(await METHODS.getCountryCode(address));
    } catch (error) {
      return { valid: false, error: [ERROR_STRING] };
    } finally {
      valid = !!countryCodeInt;
      countryCodeStr =
        String.fromCharCode(countryCodeInt >> 16) +
        String.fromCharCode(countryCodeInt - ((countryCodeInt >> 16) << 16));
    }

    return {
      valid,
      record: { address, country: valid ? countryCodeStr : undefined },
    };
  }
}
