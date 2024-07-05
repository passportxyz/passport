import axios from "axios";
import { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { getRPCProvider } from "../../utils/signer";
import { Contract, BigNumber } from "ethers";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
    ],
    name: "tokenIdOf",
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

type ISBT721Contract = {
  tokenIdOf(from: string): Promise<BigNumber>;
};

export class BinanceProvider implements Provider {
  private binanceRpc: string = "https://bsc-dataseed1.binance.org/";
  private binanceSbtEndpoint: string = "https://www.binance.info/bapi/asset/v1/public/wallet-direct/babt/metadata";
  private babTokenContractAddress: string = "0x2b09d47d550061f995a3b5c6f0fd58005215d7c8";
  type = "BinanceBABT";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address;
    const tokenResponse = await this.getTokenId(address);
    if (tokenResponse.error) {
      return {
        valid: false,
        errors: tokenResponse.error,
      };
    }

    const babtId = await this.getBABTId(tokenResponse.tokenId);

    const valid = !!babtId;

    if (!valid) {
      return {
        valid: false,
        errors: ["BABT not found"],
      };
    }

    return {
      valid,
      record: {
        id: babtId,
      },
    };
  }

  async getBABTId(tokenId: string): Promise<string | undefined> {
    // {
    // "id": "0x7163ade991102bea82c6c5321c0cfd742657a011948c2ded1a041b14f173f0f0",
    // "description": "Binance Account Bound Token",
    // "externalUrl": "https://safu.im/U9eeKjE4",
    // "image": "https://public.nftstatic.com/images/babt/token-dark.gif",
    // "name": "BABT",
    // "attributes": [],
    // "credentialList": []
    // }
    try {
      const metaData: {
        data: {
          id?: string;
        };
      } = await axios.get(`${this.binanceSbtEndpoint}/${tokenId}`);
      return metaData.data?.id;
    } catch (e) {
      handleProviderAxiosError(e, "Binance");
    }
  }

  async getTokenId(address: string): Promise<{
    tokenId: string;
    error?: string[];
  }> {
    try {
      const provider = getRPCProvider(this.binanceRpc);
      const babtContract = new Contract(this.babTokenContractAddress, abi, provider) as unknown as ISBT721Contract;
      const tokenId = await babtContract.tokenIdOf(address);
      return {
        tokenId: tokenId.toString(),
      };
    } catch (e) {
      if (String(e).includes("The wallet has not attested any SBT")) {
        return {
          tokenId: "",
          error: [String(e)],
        };
      } else {
        throw e;
      }
    }
  }
}
