import { BigNumber, Contract } from "ethers";
import onchainInfo from "../../../deployments/onchainInfo.json";
import passportDecoderABIs from "../../../deployments/abi/GitcoinPassportDecoder.json";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PassportCache } from "@gitcoin/passport-platforms";

const rpcs: { [K in keyof typeof onchainInfo]?: string } = {
  "0x14a33": process.env.BASE_GOERLI_RPC_URL,
};

export class GitcoinPassportDecoder {
  address: string;
  abi: string[];
  contract: Contract;
  cache: PassportCache = new PassportCache();

  constructor(attestationChainIdHex: keyof typeof onchainInfo) {
    const { GitcoinPassportDecoder } = onchainInfo[attestationChainIdHex] as {
      GitcoinPassportDecoder: { address: string };
    };
    if (!GitcoinPassportDecoder) throw new Error("Invalid GitcoinPassportDecoder address");

    this.address = GitcoinPassportDecoder.address;
    this.abi = passportDecoderABIs[attestationChainIdHex as keyof typeof passportDecoderABIs];

    if (!rpcs[attestationChainIdHex]) throw new Error("Missing RPC URL");
    const provider = new StaticJsonRpcProvider(rpcs[attestationChainIdHex]);

    this.contract = new Contract(this.address, this.abi, provider);
  }

  async init(): Promise<void> {
    await this.cache.init();
  }

  async #providersNeedUpdate(): Promise<boolean> {
    const lastUpdate = await this.cache.get("ethPriceLastUpdate");
    const lastUpdateTimestamp = Date.now() - Number(lastUpdate || Date.now());
    const twelveHrs = 1000 * 60 * 60 * 12;
    return lastUpdateTimestamp > twelveHrs;
  }

  async onChainProviders(providerVersion: BigNumber): Promise<PROVIDER_ID[]> {
    if ((await this.#providersNeedUpdate()) || (await this.cache.get("decodedProviders")) === null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const providers = await this.contract.getProviders(providerVersion);
      await this.cache.set("decodedProviders", JSON.stringify(providers));
      return providers as unknown as PROVIDER_ID[];
    }

    return JSON.parse(await this.cache.get("decodedProviders")) as unknown as PROVIDER_ID[];
  }
}
