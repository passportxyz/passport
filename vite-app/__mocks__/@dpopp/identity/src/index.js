const identity = {};

// pass a false proof
identity.generateMerkle = jest.fn(() => ({
  proofs: ['proof'],
  root: "merkleRoot",
}));
// always verifies
identity.verifyCredential = jest.fn(() => true);
identity.verifyMerkleProof = jest.fn(() => true);

// mock nested directory
identity.dist = {
    'didkit-browser.js': {}
};

// return full mock
module.exports = identity;
