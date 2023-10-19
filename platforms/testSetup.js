process.env.ZKSYNC_ERA_MAINNET_ENDPOINT = "https://zksync-era-api-endpoint.io";
jest.mock("redis", () => {
  // Import your mock Redis client here, so that it doesn't interfere with other mocks
  const { createClient } = require("./src/__tests__/mocks/redis");
  return {
    createClient: jest.fn().mockImplementation(createClient),
  };
});
