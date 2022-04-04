const identity = {};

// pass a false proof
identity.parseProofs = jest.fn(() => ({
  username: 'proof',
}));
// always verifies
identity.verifyCredential = jest.fn(() => true);
identity.verifyMerkleProof = jest.fn(() => true);

module.exports = identity;
