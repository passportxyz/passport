// ----- Tooling to build & verify merkleTrees
import MerkleTools, { Proof } from 'merkle-tools';
import crypto from 'crypto';

// ----- Types
import { MerkleRecord } from '@dpopp/types';

// Generate a merkle from the record object held within the payload
export const generateMerkle = (record: MerkleRecord) => {
  // props to access the merkle leafs
  let counter = 0;
  let prop: keyof typeof record;

  // generate a new tree
  const merkleTools = new MerkleTools({
    hashType: 'sha256',
  });
  // each proof relates to an entry in Payload.record
  const proofs: { [k: string]: any } = {};

  // ensure record is provide
  if (record) {
    for (prop in record) {
      if (record.hasOwnProperty(prop)) {
        // add leaf to merkle
        merkleTools.addLeaf(record[prop] || "", true);
      }
    }
  }

  // make the tree
  merkleTools.makeTree();

  // get proof for each item of record
  if (record) {
    for (prop in record) {
      if (record.hasOwnProperty(prop)) {
        // set proof and incr counter
        proofs[prop] = merkleTools.getProof(counter++);
      }
    }
  }

  // return content required to carry out verification of the merkleTree content
  return {
    proofs,
    root: merkleTools.getMerkleRoot(),
  };
};

// Verify that a given value fits into the merkle root
export const verifyMerkleProof = (proof: Proof<string | Buffer>, value: string, root: string) => {
  // create a new merkleTree
  const merkleTools = new MerkleTools({
    hashType: 'sha256',
  });
  // generate a hash from the given value
  const hash = crypto.createHash('sha256').update(value).digest();

  // validate that the proof+hash is present in the root
  return merkleTools.validateProof(proof, hash, Buffer.from(root, 'base64'));
};
