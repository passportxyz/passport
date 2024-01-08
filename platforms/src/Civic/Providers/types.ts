// Mapping civic passes to [EIP3525](https://eips.ethereum.org/EIPS/eip-3525) slotIDs
import { BigNumber } from "@ethersproject/bignumber";

export enum CivicPassType {
  CAPTCHA = 4,
  IDV = 6,
  UNIQUENESS = 10,
  LIVENESS = 11,
}

export const supportedCivicPassTypes = Object.values(CivicPassType).filter(Number) as CivicPassType[];

export const supportedChains = [
  // Mainnets
  "ETHEREUM_MAINNET",
  "POLYGON_POS_MAINNET",
  "POLYGON_ZKEVM_MAINNET",
  "ARBITRUM_MAINNET",
  "XDC_MAINNET",
  // Testnets
  "GOERLI",
  "SEPOLIA",
  "MUMBAI",
  "POLYGON_ZKEVM_TESTNET",
  "ARBITRUM_GOERLI",
  "XDC_APOTHEM",
] as const;

export type SupportedChain = typeof supportedChains[number];

type CivicPassState = "ACTIVE" | "FROZEN" | "REVOKED";

export type CivicPassLookupPass = {
  type: {
    slotId: number;
    address: string;
    name?: string;
  };
  chain: string;
  identifier: string;
  expiry?: number;
  state: CivicPassState;
};
export type PassesForAddress = { passes: Record<string, CivicPassLookupPass[]> };
export type CivicPassLookupResponse = Record<string, PassesForAddress>;

type PassDetails = {
  expiry?: BigNumber;
  identifier: string;
  state: CivicPassState;
};
export type Pass = PassDetails & {
  type: CivicPassType;
  chain: SupportedChain;
};
