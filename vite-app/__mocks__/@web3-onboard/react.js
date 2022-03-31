const react = {};

const mockConnectFn = jest.fn();
const mockDisconnectFn = jest.fn();
const mockUseConnectWallet = () => [
  { wallet: {} },
  mockConnectFn,
  mockDisconnectFn,
];

react.useConnectWallet = mockUseConnectWallet;

const mockSetChain = jest.fn();
const mockUseSetChain = () => [
  { chains: [], connectedChain: {}, settingChain: false },
  mockSetChain,
];

react.useSetChain = mockUseSetChain;

react.useWallets = () => [];

module.exports = react;
