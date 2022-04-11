// ---- Test subject - (NOTE: this is an integration test rather than a unit test)
import { ProofRecord } from "@dpopp/types";
import { generateMerkle, verifyMerkleProof } from "../src/merkle";

// Sample record
const record = {
  type: "Simple",
  address: "0x0",
  version: "0.0.0",
};

// Generate the merkleTree
const merkle = generateMerkle(record);

describe("MerkleTree", function () {
  it("can generate a merkleTree", () => {
    expect(merkle.root).toEqual("4tPCpmsNW5ndVJCYW9akgvXcFqVcRW7OrZH4oPBe2gE=");
  });
  it("cannot generate a merkleTree if we're not providing any leafs", () => {
    // we need atleast one leaf to get a root and two to generate proofs
    expect(() => generateMerkle({} as ProofRecord)).toThrow(
      "Add more leafs before attempting to construct a merkleTree"
    );
  });
  it("cannot generate a merkleTree if we're not providing enough leafs", () => {
    // we need atleast one leaf to get a root and two to generate proofs
    expect(() =>
      generateMerkle({
        type: "Simple",
      } as ProofRecord)
    ).toThrow("Add more leafs before attempting to construct a merkleTree");
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
});
