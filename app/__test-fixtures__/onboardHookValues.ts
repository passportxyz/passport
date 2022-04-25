import { Account, WalletState } from "@web3-onboard/core/dist/types";

export const mockAddress = "0xmyAddress";
export const mockAccount: Account = {
  address: mockAddress,
  ens: null,
  balance: null,
};
export const mockWallet: WalletState = {
  label: "myWallet",
  icon: "",
  provider: { on: jest.fn(), removeListener: jest.fn(), request: jest.fn() },
  accounts: [mockAccount],
  chains: [],
};
