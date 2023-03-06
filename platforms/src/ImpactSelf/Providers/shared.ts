// ----- Ethers library
import { Contract, BigNumber } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// Impact Self Contract Address
const IMPACT_SELF_CONTRACT_ADDRESS = "0xF4cC869685A722403c22A66C113947c0F3114B47";

// Impact Self functions needed to get the handle
const IMPACT_SELF_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "getUserData",
    outputs: [
      {
        components: [
          {
            internalType: "bool",
            name: "isOwner",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isPrivate",
            type: "bool",
          },
          {
            internalType: "address[]",
            name: "sources",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "scores",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "weights",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "rawScore",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "score",
            type: "uint256",
          },
        ],
        internalType: "struct UserData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

interface IGetUserDataResponse {
  isOwner: boolean;
  score: BigNumber;
  scores: BigNumber[];
}

export interface IImpactSelfUserData {
  isOwner: boolean;
  score: number;
  activeSources: number;
}

const parseBigNumber = (bn: BigNumber): number => (bn?._isBigNumber ? parseInt(bn?._hex, 16) : 0);

// Retrieve the Impact Self data relative to the user
export async function getUserData(userAddress: string): Promise<IImpactSelfUserData> {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(
    process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"
  );

  const contract = new Contract(IMPACT_SELF_CONTRACT_ADDRESS, IMPACT_SELF_ABI, provider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const userData: IGetUserDataResponse = await contract.getUserData(userAddress);

  const isOwner = userData.isOwner;
  const score = parseBigNumber(userData.score);
  const activeSources = userData.scores.map(parseBigNumber).filter((score) => score > 0).length;
  return { isOwner, score, activeSources };
}
