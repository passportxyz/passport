// mock everything that we're using in @dpopp/identity/dist/commonjs into an object and export it
const identity = {};

// always returns dummy challenge
identity.issueChallengeCredential = jest.fn(async (DIDKit, key, record) => ({
  credential: {
    issuer: "empty",
    credentialSubject: {
      id: `did:ethr:${record.address}#challenge-${record.type}`,
      challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
    },
  },
}));

// always returns dummy VC
identity.issueHashedCredential = jest.fn(async (DIDKit, key, record) => ({
  record: {
    type: record.type,
    address: record.address,
    version: record.version,
  },
  credential: {
    credentialSubject: {
      id: `did:ethr:${record.address}#${record.type}`,
      hash: "0x0-and-the-rest-of-hash",
      provider: "PROVIDER",
    },
  },
  proofs: [],
}));

// always verifies
identity.verifyCredential = jest.fn(async () => true);

// return full mock
module.exports = identity;
