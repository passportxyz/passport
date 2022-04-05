const react = {};

const mockConnectFn = jest.fn(() => new Promise((resolve) => resolve()));
const mockDisconnectFn = jest.fn(() => new Promise((resolve) => resolve()));
const mockUseConnectWallet = () => [{ wallet: {} }, mockConnectFn, mockDisconnectFn];

react.useConnectWallet = mockUseConnectWallet;

const mockSetChain = jest.fn();
const mockUseSetChain = () => [{ chains: [], connectedChain: {}, settingChain: false }, mockSetChain];

react.useSetChain = mockUseSetChain;

react.useWallets = () => [];

module.exports = react;
