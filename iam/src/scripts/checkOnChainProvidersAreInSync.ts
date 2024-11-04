import dotenv from "dotenv";
import { JsonRpcProvider, Contract, version } from "ethers";
import decoderAbi from "../../../deployments/abi/GitcoinPassportDecoder.json";

import providerBitMapInfo from "../static/providerBitMapInfo.json";
dotenv.config();

console.log(process.argv);

const apiUrl = process.argv[2] + process.env.ALCHEMY_API_KEY;
const chainId = process.argv[3] as keyof typeof decoderAbi;
const decoderContractAddress = process.argv[4];

console.log("ethers version             :", version);
console.log("chainId                    :", chainId);
console.log("decoderContractAddress     :", decoderContractAddress);

function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const diff = new Set<T>(setA);
  for (const elem of setB) {
    diff.delete(elem);
  }
  return diff;
}

async function main() {
  let exitCode = 0;
  const provider = new JsonRpcProvider(apiUrl);
  const decoderContract = new Contract(decoderContractAddress, decoderAbi[chainId], provider);

  const latestOnChainProviderVersion = await decoderContract.currentVersion();
  console.log("latestOnChainProviderVersion:", latestOnChainProviderVersion);

  const decoderProviders: string[] = await decoderContract.getProviders(Number(latestOnChainProviderVersion));
  const onChainProviders = new Set(decoderProviders.map((p: string, idx: number) => `${idx} => ${p}`));
  const providerBitmapProviders = providerBitMapInfo.reduce((acc, cur) => {
    const idx = cur.index * 256 + cur.bit;
    acc.add(`${idx} => ${cur.name}`);
    return acc;
  }, new Set<string>());

  console.log("providerBitmapProviders  :", providerBitmapProviders);
  console.log("onChainProviders         :", onChainProviders);

  const missingOnChain = difference(providerBitmapProviders, onChainProviders);
  const missingOffChain = difference(onChainProviders, providerBitmapProviders);

  console.log("missingOnChain   :", missingOnChain);
  console.log("missingOffChain  :", missingOffChain);

  if (missingOnChain.size > 0) {
    console.log("❌ on-chain configuration is not up to date", missingOnChain.size);
    console.log("❌ the following providers are missing on-chain", missingOnChain);
    exitCode = 1;
  }

  if (missingOffChain.size > 0) {
    console.log(
      "❌ off-chain configuration is broken. Some on-chain providers are not available in the off-chain configuration. Number of missing providers: ",
      missingOffChain.size
    );
    console.log("❌ the following providers are missing on-chain", missingOffChain);
    exitCode = 1;
  }

  process.exit(exitCode);
}

main();
