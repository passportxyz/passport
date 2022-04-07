// ----- Tooling to build & verify merkleTrees
import MerkleTools, { Proof } from "hash-js-merkle-tools";

// ----- Types
import { ProofRecord } from "@dpopp/types";

// Generate a merkle from the record object held within the payload
export const generateMerkle = (
  record: ProofRecord
): {
  proofs: { [key: string]: Proof<string>[] | null };
  root: string;
} => {
  // props to access the merkle leafs
  let counter = 0;
  let prop: keyof typeof record;

  // generate a new tree
  const merkleTools = new MerkleTools({
    hashType: "sha256",
  });
  // each proof relates to an entry in Payload.record
  const proofs: { [key: string]: Proof<string>[] | null } = {};

  for (prop in record) {
    if (Object.hasOwnProperty.call(record, prop)) {
      // add leaf to merkle
      merkleTools.addLeaf(record[prop], true);
    }
  }

  if (Object.keys(record).length > 0) {
    // make the tree
    merkleTools.makeTree();
  }

  // get proof for each item of record
  for (prop in record) {
    if (Object.hasOwnProperty.call(record, prop)) {
      // set proof and incr counter
      proofs[prop] = merkleTools.getProof(counter++);
    }
  }

  // return content required to carry out verification of the merkleTree content
  return {
    proofs,
    root: merkleTools.getMerkleRoot()?.toString("base64") || "",
  };
};

// Verify that a given value fits into the merkle root
export const verifyMerkleProof = (proof: Proof<string>[] | null, value: string, root: string): boolean => {
  // create a new merkleTree
  const merkleTools = new MerkleTools({
    hashType: "sha256",
  });
  // generate a hash from the given value
  const hash = merkleTools.hash(value);

  // validate that the proof+hash is present in the root
  return proof && hash && root ? merkleTools.validateProof(proof, hash, Buffer.from(root, "base64")) : false;
};
