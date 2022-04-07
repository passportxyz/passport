// mock everything that we're using in @dpopp/identity/src into an object and export it
const identity = {};

// pass a false proof
identity.generateMerkle = jest.fn(() => ({
  proofs: ["proof"],
  root: "merkleRoot",
}));
// always verifies
identity.verifyCredential = jest.fn(() => true);
identity.verifyMerkleProof = jest.fn(() => true);

// return full mock
module.exports = identity;
