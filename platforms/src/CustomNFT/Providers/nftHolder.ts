import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider } from "../../types.js";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export const nftConditionEndpoint = `${process.env.SCORER_ENDPOINT}/internal/customization/credential`;

const RPC_TIMEOUT_MS = 10_000;

type NFTContract = {
  address: string;
  chainId: number;
  standard?: string;
};

type NFTCondition = {
  contracts: NFTContract[];
};

type ConditionResponse = {
  data: {
    ruleset: {
      condition: NFTCondition;
    };
  };
};

const getCondition = async (type: string, conditionName: string, conditionHash: string): Promise<NFTCondition> => {
  try {
    const url = `${nftConditionEndpoint}/${encodeURIComponent(`${type}#${conditionName}#${conditionHash}`)}`;
    const response: ConditionResponse = await axios.get(url, {
      headers: { Authorization: process.env.SCORER_API_KEY },
    });
    return response.data.ruleset.condition;
  } catch (error) {
    handleProviderAxiosError(error, "NFT holder condition");
  }
};

export class NFTHolderProvider implements Provider {
  type = "NFTHolder";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors: string[] = [];
    let valid = false;
    let record: Record<string, string> | undefined = undefined;

    const { conditionName, conditionHash } = payload.proofs;
    const address = payload.address;

    const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
    if (!address || !ETH_ADDRESS_RE.test(address)) {
      return { valid: false, errors: ["Invalid wallet address"] };
    }

    if (!conditionName || !conditionHash) {
      return {
        valid: false,
        errors: ["Missing conditionName or conditionHash in payload"],
      };
    }

    const condition = await getCondition(this.type, conditionName, conditionHash);

    if (!condition?.contracts?.length) {
      return {
        valid: false,
        errors: ["Invalid condition: no contracts defined"],
      };
    }

    const MAX_CONTRACTS = 20;
    if (condition.contracts.length > MAX_CONTRACTS) {
      return {
        valid: false,
        errors: [`Too many contracts: ${condition.contracts.length} exceeds limit of ${MAX_CONTRACTS}`],
      };
    }

    // Check all contracts in parallel (OR logic — any match is sufficient)
    const results = await Promise.allSettled(
      condition.contracts.map(async (contract) => {
        const balance = await checkNFTBalance(address, contract);
        return { contract, balance };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.balance > 0) {
        valid = true;
        record = { address, conditionName, conditionHash };
        break;
      }
    }

    if (!valid) {
      const failedCount = results.filter((r) => r.status === "rejected").length;
      const errorMsg =
        failedCount > 0
          ? `No matching NFT holdings found (${failedCount}/${results.length} checks failed)`
          : "No matching NFT holdings found";
      errors.push(errorMsg);
    }

    return { valid, errors, record };
  }
}

async function checkNFTBalance(ownerAddress: string, contract: NFTContract): Promise<number> {
  // Use JSON-RPC eth_call to check balanceOf
  const rpcUrl = getRpcUrl(contract.chainId);

  // ERC-721 balanceOf(address) selector: 0x70a08231
  const data = `0x70a08231000000000000000000000000${ownerAddress.slice(2).toLowerCase()}`;

  const response = await axios.post(
    rpcUrl,
    {
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: contract.address, data }, "latest"],
      id: 1,
    },
    { timeout: RPC_TIMEOUT_MS }
  );

  if (response.data.error) {
    throw new Error(`RPC error: ${response.data.error.message}`);
  }

  return parseInt(response.data.result, 16);
}

const ALCHEMY_CHAIN_SLUGS: Record<number, string> = {
  1: "eth-mainnet",
  10: "opt-mainnet",
  56: "bnb-mainnet",
  100: "gnosis-mainnet",
  137: "polygon-mainnet",
  250: "fantom-mainnet",
  324: "zksync-mainnet",
  1101: "polygonzkevm-mainnet",
  1329: "sei-mainnet",
  5000: "mantle-mainnet",
  7000: "zetachain-mainnet",
  8453: "base-mainnet",
  42161: "arb-mainnet",
  42170: "arbnova-mainnet",
  42220: "celo-mainnet",
  43114: "avax-mainnet",
  59144: "linea-mainnet",
  81457: "blast-mainnet",
  534352: "scroll-mainnet",
};

function getRpcUrl(chainId: number): string {
  const slug = ALCHEMY_CHAIN_SLUGS[chainId];
  if (!slug) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("ALCHEMY_API_KEY is not configured");
  }
  return `https://${slug}.g.alchemy.com/v2/${apiKey}`;
}
