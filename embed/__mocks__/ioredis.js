// __mocks__/ioredis.ts
const RedisMock = jest.fn().mockImplementation(() => {
  return {
    get: jest.fn((key) => Promise.resolve(null)),
    set: jest.fn((key, value) => {
      return Promise.resolve("OK");
    }),
    on: jest.fn((key, func) => {}),
    call: jest.fn((type, ...args) => {
      if(type === "EVALSHA") {
        return Promise.resolve([ 1, 60000 ]);
      }
      return Promise.resolve("OK");
    }),
  };
});

module.exports = RedisMock;
