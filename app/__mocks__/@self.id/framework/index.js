const framework = {};

const mockConnectFn = jest.fn(() => new Promise((resolve) => resolve()));
const mockDisconnectFn = jest.fn(() => new Promise((resolve) => resolve()));

const viewerConnection = {
  status: "idle",
};

framework.useViewerConnection = [viewerConnection, mockConnectFn, mockDisconnectFn];

module.exports = framework;
