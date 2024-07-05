var address = "0xfF7edbD01e9d044486781ff52c42EA7a01612644";
var switchNetwork = jest.fn();
var openModal = jest.fn();

module.exports = {
  mockAddress: address,
  switchNetworkMock: switchNetwork,
  openModalMock: openModal,
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useSwitchNetwork: () => ({
    switchNetwork: switchNetwork,
  }),
  defaultConfig: jest.fn(),
  createWeb3Modal: jest.fn(),
  useWeb3ModalError: () => ({
    error: undefined,
  }),
  useWeb3ModalProvider: () => ({
    provider: jest.fn(),
  }),
  useWeb3ModalState: () => ({
    open: false,
  }),
  useWeb3Modal: () => ({
    open: openModal,
  }),
  useWeb3ModalEvents: () => ({
    data: {
      event: "MODAL_CLOSE",
      properties: {
        connected: true,
      },
    },
  }),
  useWeb3ModalAccount: () => ({
    isConnected: true,
    address: address,
    chain: 10,
  }),
};
