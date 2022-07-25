const keyToDID = jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY"));

const keyToVerificationMethod = jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY#PUBLIC_KEY"));

const issueCredential = jest.fn((credential) =>
  Promise.resolve(
    JSON.stringify({
      ...JSON.parse(credential),
      proof: {},
    })
  )
);
const verifyCredential = jest.fn(() =>
  Promise.resolve(
    JSON.stringify({
      checks: [],
      warnings: [],
      errors: [],
    })
  )
);

const clearDidkitMocks = () => {
  keyToDID.mockClear();
  keyToVerificationMethod.mockClear();
  issueCredential.mockClear();
  verifyCredential.mockClear();
};

// ---- Generate & Verify methods
module.exports = {
  keyToDID,
  keyToVerificationMethod,
  issueCredential,
  verifyCredential,

  /* Mock helpers */
  clearDidkitMocks,
};
