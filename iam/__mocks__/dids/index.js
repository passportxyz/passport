const dids = {
  DID: jest.fn().mockImplementation(() => ({
    verifyJWS: jest.fn(),
  })),
};

module.exports = dids;
