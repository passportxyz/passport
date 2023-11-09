const react = {};

const mockConnectFn = jest.fn(() => new Promise((resolve) => resolve()));
const mockDisconnectFn = jest.fn(() => new Promise((resolve) => resolve()));
const mockUseConnectWallet = () => [{ wallet: {} }, mockConnectFn, mockDisconnectFn];

react.useConnectWallet = mockUseConnectWallet;

react.useWallets = () => [];

module.exports = react;
