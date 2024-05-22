import { RequestPayload } from "@gitcoin/passport-types";
import { Contract } from "@ethersproject/contracts";
import { getOptimismRPCProvider } from "../../utils/signer";

const ERC721_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
    constant: true,
  },
];

type TokenBalanceContract = {
  balanceOf: (address: string) => Promise<string>;
};

export async function getTokenBalance(
  address: string,
  tokenContractAddress: string,
  decimalNumber: number,
  payload: RequestPayload
): Promise<number> {
  const staticProvider = getOptimismRPCProvider(payload);
  const readContract = new Contract(tokenContractAddress, ERC721_ABI, staticProvider);
  const balanceOfFunc = readContract.balanceOf as (address: string) => Promise<string>;
  const tokenBalance = await balanceOfFunc(address);
  return parseFloat(tokenBalance);
}
