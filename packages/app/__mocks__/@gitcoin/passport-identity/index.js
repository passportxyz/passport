// mock everything that we're using in @gitcoin/passport-identity/src into an object and export it
const identity = {};

// always verifies
identity.verifyCredential = jest.fn(() => true);
identity.fetchVerifiableCredential = jest.fn(() => true);

// return full mock
module.exports = identity;
