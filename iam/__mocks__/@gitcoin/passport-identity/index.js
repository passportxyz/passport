const realIdentity = require("@gitcoin/passport-identity");

// mock everything that we're using in @gitcoin/passport-identity/dist/commonjs into an object and export it
const identity = {};

// always returns dummy challenge
identity.issueChallengeCredential = jest.fn(async (DIDKit, key, record) => ({
  credential: {
    issuer: "empty",
    credentialSubject: {
      id: `did:pkh:eip155:1:${record.address}`,
      provider: `challenge-${record.type}`,
      challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
    },
  },
}));

// always verifies
identity.verifyCredential = jest.fn(async () => true);

identity.verifyProvidersAndIssueCredentials = jest.fn(async () => []);

// return full mock
module.exports = {
  ...realIdentity,
  ...identity,
  realIdentity,
};
