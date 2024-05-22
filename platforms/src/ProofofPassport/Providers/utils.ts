
import { RequestPayload } from "@gitcoin/passport-types";
import { Contract } from "@ethersproject/contracts";
import { getRPCProvider } from "../../utils/signer";

const ERC721_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "payable": false, "stateMutability": "view", "type": "function", "constant": true
    }
]
export async function getTokenBalance(
    address: string,
    tokenContractAddress: string,
    decimalNumber: number,
    payload: RequestPayload
): Promise<number> {
    const staticProvider = getRPCProvider(payload);
    console.log("tokenContractAddress:", tokenContractAddress);
    console.log("address", address);
    console.log("decimalNumber:", decimalNumber);
    const readContract = new Contract(tokenContractAddress, ERC721_ABI, staticProvider);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const tokenBalance: string = await readContract?.balanceOf(address);
    console.log("tokenBalance call:", tokenBalance);
    return parseFloat(tokenBalance);
}