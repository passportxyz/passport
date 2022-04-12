// ---- Generate & Verify methods
module.exports = {
  keyToDID: jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY")),
  keyToVerificationMethod: jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY#PUBLIC_KEY")),
  issueCredential: jest.fn((credential) =>
    Promise.resolve(
      JSON.stringify({
        ...JSON.parse(credential),
        proof: {},
      })
    )
  ),
  verifyCredential: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
        checks: [],
        warnings: [],
        errors: [],
      })
    )
  ),
};
