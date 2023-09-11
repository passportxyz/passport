import { Account, ConnectedChain, WalletState } from "@web3-onboard/core/dist/types";

const sepoliaChainId = "0xaa36a7";
export const mockAddress = "0xmyAddress";
export const mockAccount: Account = {
  address: mockAddress,
  ens: null,
  uns: null,
  balance: null,
};
export const mockWallet: WalletState = {
  label: "myWallet",
  icon: "",
  provider: { on: jest.fn(), removeListener: jest.fn(), request: jest.fn() },
  accounts: [mockAccount],
  chains: [
    [
      {
        id: sepoliaChainId,
      },
    ] as unknown as ConnectedChain,
  ],
};
