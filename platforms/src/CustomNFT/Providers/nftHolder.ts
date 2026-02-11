import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider } from "../../types.js";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export const nftConditionEndpoint = `${process.env.SCORER_ENDPOINT}/internal/customization/credential`;

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
    const url = `${nftConditionEndpoint}/${type}%23${conditionName}%23${conditionHash}`;
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

  const response = await axios.post(rpcUrl, {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [{ to: contract.address, data }, "latest"],
    id: 1,
  });

  if (response.data.error) {
    throw new Error(`RPC error: ${response.data.error.message}`);
  }

  return parseInt(response.data.result, 16);
}

function getRpcUrl(chainId: number): string {
  // Map chainId to RPC URL from environment
  const rpcUrls: Record<number, string | undefined> = {
    1: process.env.MAINNET_RPC_URL,
    10: process.env.OPTIMISM_RPC_URL,
    137: process.env.POLYGON_RPC_URL,
    42161: process.env.ARBITRUM_RPC_URL,
    8453: process.env.BASE_RPC_URL,
  };

  const url = rpcUrls[chainId] || process.env.MAINNET_RPC_URL;
  if (!url) {
    throw new Error(`No RPC URL configured for chainId ${chainId}`);
  }
  return url;
}
