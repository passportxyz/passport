import { mock } from "jest-mock-extended";

import { UserContextState } from "../src/App";
import { mockAddress, mockWallet } from "./onboardHookValues";

export const getLoggedInUserContext = (initialValueOverrides?: Partial<UserContextState>) => {
  return {
    ...mock<UserContextState>(),
    loggedIn: true,
    passport: undefined,
    address: mockAddress,
    connectedWallets: [mockWallet],
    signer: undefined,
    walletLabel: mockWallet.label,
    ...initialValueOverrides,
  };
};

export const getLoggedOutUserContext = (initialValueOverrides?: Partial<UserContextState>) => {
  return getLoggedInUserContext({
    loggedIn: false,
    address: undefined,
    connectedWallets: [],
    signer: undefined,
    walletLabel: undefined,
    ...initialValueOverrides,
  });
};
