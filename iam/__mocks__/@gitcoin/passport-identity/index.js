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
identity.verifyDidChallenge = jest.fn().mockImplementation(() => "0x0");
identity.verifyChallengeAndGetAddress = jest.fn().mockImplementation(() => {
  return "0x0";
});
identity.hasValidIssuer = jest.fn().mockImplementation(realIdentity.hasValidIssuer);

// return full mock
module.exports = {
  ...realIdentity,
  ...identity,
  getEip712Issuer: realIdentity.getEip712Issuer,
  VerifyDidChallengeBaseError: realIdentity.VerifyDidChallengeBaseError,
  realIdentity,
};
