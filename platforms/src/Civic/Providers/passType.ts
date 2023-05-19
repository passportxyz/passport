// Mapping civic passes to [EIP3525](https://eips.ethereum.org/EIPS/eip-3525) slotIDs
export enum CivicPassType {
  CAPTCHA = 4,
  IDV = 6,
  UNIQUENESS = 10,
  LIVENESS = 11,
}

export const supportedCivicPassTypes = Object.values(CivicPassType).filter(Number) as CivicPassType[];
