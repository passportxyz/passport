import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;

const mockWallet = {
  address: "0xfF7edbD01e9d044486781ff52c42EA7a01612644",
  chain: "0xa",
  provider: jest.fn(),
};

jest.mock("@web3-onboard/react", () => ({
  init: () => ({
    connectWallet: () => Promise.resolve([mockWallet]),
    disconnectWallet: () => Promise.resolve(),
    state: {
      select: () => ({
        subscribe: () => {},
      }),
    },
  }),
  useConnectWallet: () => [{ wallet: mockWallet }, () => Promise.resolve([mockWallet]), jest.fn()],
  useSetChain: () => [{ id: "0xa" }, jest.fn()],
}));

jest.mock("@web3-onboard/injected-wallets", () => ({
  __esModule: true,
  default: () => {},
}));

jest.mock("@web3-onboard/walletconnect", () => ({
  __esModule: true,
  default: () => {},
}));
