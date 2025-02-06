process.env.ZKSYNC_ERA_MAINNET_ENDPOINT = "https://zksync-era-api-endpoint.io";
process.env.PASSPORT_SCORER_BACKEND = "https://scorer-gtc.com";
process.env.SCORER_API_KEY = "abcdefg12345567";

jest.mock("redis", () => {
  // Import your mock Redis client here, so that it doesn't interfere with other mocks
  const { createClient } = require("./src/__tests__/mocks/redis");
  return {
    createClient: jest.fn().mockImplementation(createClient),
  };
});
