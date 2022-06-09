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

// always returns dummy VC
identity.issueHashedCredential = jest.fn(async (DIDKit, key, address, record) => ({
  record: {
    type: record.type,
    version: record.version,
  },
  credential: {
    credentialSubject: {
      id: `did:pkh:eip155:1:${address}`,
      hash: "0x0-and-the-rest-of-hash",
      provider: `${record.type}`,
    },
  },
  proofs: [],
}));

// always verifies
identity.verifyCredential = jest.fn(async () => true);

// return full mock
module.exports = identity;
