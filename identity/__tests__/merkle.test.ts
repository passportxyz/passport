// ---- Test subject
import { ProofRecord } from "@dpopp/types";
import { generateMerkle, verifyMerkleProof } from "../src/merkle";

// Sample record
const record = {
  type: "Simple",
  address: "0x0",
  version: "0.0.0",
  username: "test",
};

// Generate the merkleTree
const merkle = generateMerkle(record);

describe("MerkleTree", function () {
  it("can generate a merkleTree", () => {
    expect(merkle.root).toEqual("gv8oALCsnbsEMM9gSzJYN7d49UJ/CvPN3t9Xenj70gM=");
  });
  it("cannot generate a merkleTree if we're not providing enough leafs", () => {
    // Generate the merkleTree
    const failMerkle = generateMerkle({
      type: "Simple",
    } as ProofRecord);
    // we need atleast two leafs to construct the tree
    expect(failMerkle.proofs.type.length).toEqual(0);
  });
  it("can verify a merkle proof", () => {
    const verifyMerkle = verifyMerkleProof(merkle.proofs.address, record.address, merkle.root);
    expect(verifyMerkle).toEqual(true);
  });
  it("cannot verify if the record value is wrong", () => {
    const verifyMerkle = verifyMerkleProof(merkle.proofs.address, "wrong", merkle.root);
    expect(verifyMerkle).toEqual(false);
  });
  it("cannot verify if merkle proof is null", () => {
    const verifyMerkle = verifyMerkleProof(null, record.address, merkle.root);
    expect(verifyMerkle).toEqual(false);
  });
  it("cannot generate a merkleTree if we're not providing any leafs", () => {
    // Generate the merkleTree
    const failMerkle = generateMerkle({} as ProofRecord);
    // we need atleast two leafs to construct the tree
    expect(JSON.stringify(failMerkle.proofs)).toEqual("{}");
  });
});
