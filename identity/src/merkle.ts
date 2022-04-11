// ----- Tooling to build & verify merkleTrees
import MerkleTools, { Proof } from "hash-js-merkle-tools";

// ----- Types
import { ProofRecord } from "@dpopp/types";

// Generate a merkle from the record object held within the payload
export const generateMerkle = (
  record: ProofRecord
): {
  proofs: { [key: string]: Proof<string>[] | null };
  root: string | undefined;
} => {
  // generate a new tree
  const merkleTools = new MerkleTools({
    hashType: "sha256",
  });
  // each proof relates to an entry in Payload.record
  const proofs: { [key: string]: Proof<string>[] } = {};

  // associate the key with its counter index in merkle
  let counter = 0;
  // props to access the merkle leafs
  let prop: keyof typeof record;
  // after reading back the proofs ensure they hold a value before returning the root+proofs response
  let validProofs = true;

  // add each record as a leaf on the merkleTree
  for (prop in record) {
    if (Object.hasOwnProperty.call(record, prop)) {
      merkleTools.addLeaf(record[prop], true);
    }
  }

  // make the tree - (if the tree isnt constructed then we get back a null root + proof)
  if (Object.keys(record).length > 1) {
    merkleTools.makeTree();
  }

  // once the tree has been created get the proof for each item of record
  for (prop in record) {
    if (Object.hasOwnProperty.call(record, prop)) {
      // set proof and incr counter
      proofs[prop] = merkleTools.getProof(counter++) || [];
      // check that the proof exists and holds values
      validProofs = proofs[prop].length === 0 ? false : validProofs;
    }
  }

  // extract the root
  const root = merkleTools.getMerkleRoot();

  // if there are not enough items to record in to the tree...
  if (root === null || !validProofs) {
    throw new Error("Add more leafs before attempting to construct a merkleTree");
  }

  // return content required to carry out verification of the merkleTree content
  return {
    proofs,
    root: root.toString("base64"),
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
