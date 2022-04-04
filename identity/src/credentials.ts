// ---- Merkle methods
import { generateMerkle } from './merkle';

// ---- Types
import { ChallengeRecord, MerkleRecord, Payload } from '@dpopp/types';

// Utility to add a number of days to a date
const addSeconds = (date: Date, seconds: number) => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
};

// internal method to issue a verfiable credential
const _issueCredential = async (
  DIDKit: { [k: string]: any },
  key: string,
  expiresInSeconds: number,
  fields: { [k: string]: any }
) => {
  // get DID from key
  const issuer = DIDKit.keyToDID('key', key);
  // read method from key
  const verificationMethod = await DIDKit.keyToVerificationMethod('key', key);
  // stringify assertionMethod we feed to didkit-wasm-node
  const verifyWithMethod = JSON.stringify({
    proofPurpose: 'assertionMethod',
    verificationMethod,
  });

  // generate a verifiableCredential
  const credential = await DIDKit.issueCredential(
    JSON.stringify({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      issuer,
      issuanceDate: new Date().toISOString(),
      expirationDate: addSeconds(new Date(), expiresInSeconds).toISOString(),
      ...fields,
    }),
    verifyWithMethod,
    key
  );

  // parse the response of the DIDKit wasm
  return JSON.parse(credential);
};

// Issue a VC with challenge data
export const issueChallengeCredential = async (DIDKit: { [k: string]: any }, key: string, record: ChallengeRecord) => {
  // attempt to create a VC for the given payload
  try {
    // generate a verifiableCredential
    const credential = await _issueCredential(DIDKit, key, 60, {
      credentialSubject: {
        '@context': [
          {
            challenge: 'https://schema.org/Text',
            address: 'https://schema.org/Text',
          },
        ],
        id: `did:ethr:${record.address}#challenge-${record.type}`,
        // extra fields to convey challenge data
        challenge: record.challenge,
        address: record.address,
      },
    });

    // didkit-wasm-node returns credential as a string - parse for JSON
    return {
      credential,
    };
  } catch (e: any) {
    return {
      error: [e.toString()],
    };
  }
};

// Return a verifiable credential with embedded merkle data
export const issueMerkleCredential = async (DIDKit: { [k: string]: any }, key: string, record: MerkleRecord) => {
  // attempt to create a VC for the given payload
  try {
    // generate a merkleTree for the provided evidence
    const { proofs, root } = generateMerkle(record);
    // generate a verifiableCredential
    const credential = await _issueCredential(DIDKit, key, 30 * 86400, {
      credentialSubject: {
        '@context': [
          {
            root: 'https://schema.org/Text',
            proofs: 'https://schema.org/Text',
          },
        ],
        id: `did:ethr:${record.address}#${record.type}`,
        // custom fields to verify a merkleTree of content that the user might voluntarily share with 3rd parties
        // *loosely defined atm - How do we enforce only valid content can enter the tree?
        root: root?.toString('base64'),
        proofs: Buffer.from(JSON.stringify(proofs)).toString('base64'),
      },
    });

    // didkit-wasm-node returns credential as a string - parse for JSON
    return {
      credential,
    };
  } catch (e: any) {
    return {
      error: [e.toString()],
    };
  }
};

// Verify that the provided credential is valid
export const verifyCredential = async (DIDKit: { [k: string]: any }, credential: { [k: string]: any }) => {
  // extract expirationDate
  const { expirationDate } = credential;
  // check that the credential is still valid
  if (new Date(expirationDate) > new Date()) {
    // parse the result of attempting to verify
    const verify = JSON.parse(
      await DIDKit.verifyCredential(JSON.stringify(credential), '{"proofPurpose":"assertionMethod"}')
    );

    // did we get any errors when we attempted to verify?
    return verify.errors.length === 0;
  } else {
    // past expiry :(
    return {
      errors: ['expired'],
    };
  }
};
