// ---- Merkle methods
import { generateMerkle } from "./merkle";

// ---- Types
import { DIDKitLib, ChallengeRecord, VerificationRecord, Payload, VerifiableCredential } from "@dpopp/types";
import { JsonRpcSigner } from "@ethersproject/providers";

// ---- Node/Browser http req library
import axios from "axios";

// Utility to add a number of seconds to a date
const addSeconds = (date: Date, seconds: number) => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
};

// internal method to issue a verfiable credential
const _issueCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  expiresInSeconds: number,
  fields: { [k: string]: any }
) => {
  // get DID from key
  const issuer = DIDKit.keyToDID("key", key);
  // read method from key
  const verificationMethod = await DIDKit.keyToVerificationMethod("key", key);
  // stringify assertionMethod we feed to didkit-wasm-node
  const verifyWithMethod = JSON.stringify({
    proofPurpose: "assertionMethod",
    verificationMethod,
  });

  // generate a verifiableCredential
  const credential = await DIDKit.issueCredential(
    JSON.stringify({
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
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
export const issueChallengeCredential = async (DIDKit: DIDKitLib, key: string, record: ChallengeRecord) => {
  // attempt to create a VC for the given payload
  try {
    // generate a verifiableCredential (60s ttl)
    const credential = await _issueCredential(DIDKit, key, 60, {
      credentialSubject: {
        "@context": [
          {
            challenge: "https://schema.org/Text",
            address: "https://schema.org/Text",
          },
        ],
        id: `did:ethr:${record.address}#challenge-${record.type}`,
        // extra fields to convey challenge data
        challenge: record.challenge,
        address: record.address,
      },
    }) as VerifiableCredential;

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
export const issueMerkleCredential = async (DIDKit: DIDKitLib, key: string, record: VerificationRecord) => {
  // attempt to create a VC for the given payload
  try {
    // generate a merkleTree for the provided evidence
    const { proofs, root } = generateMerkle(record);
    // generate a verifiableCredential
    const credential = await _issueCredential(DIDKit, key, 30 * 86400, {
      credentialSubject: {
        "@context": [
          {
            root: "https://schema.org/Text",
          },
        ],
        id: `did:ethr:${record.address}#${record.type}`,
        // record the root of the records merkleTree (this will allow the user verifiably share the PPI held within the record)
        root,
      },
    }) as VerifiableCredential;

    // didkit-wasm-node returns credential as a string - parse for JSON
    return {
      credential,
      record,
      proofs,
    };
  } catch (e: any) {
    return {
      error: [e.toString()],
    };
  }
};

// Verify that the provided credential is valid
export const verifyCredential = async (DIDKit: DIDKitLib, credential: VerifiableCredential) => {
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
    return false;
  }
};

// Fetch a verifiable challenge credential
export const fetchChallengeCredential = async (iamUrl: string, payload: Payload) => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const { data } = await axios.post(`${iamUrl.replace(/\/+$/, "")}/v${payload.version}/challenge`, {
    payload: {
      address: payload.address,
      type: payload.type,
    },
  });

  return {
    challenge: data.credential as VerifiableCredential,
  };
};

// Fetch a verifiableCredential
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: Payload,
  signer: JsonRpcSigner | undefined
) => {
  // check for valid context
  if (payload.address && signer) {
    // first pull a challenge that can be signed by the user
    const { challenge } = await fetchChallengeCredential(iamUrl, payload);
    // sign the challenge provided by the IAM
    const signature = signer && (await signer.signMessage(challenge.credentialSubject.challenge)).toString();

    // pass the signature as part of the proofs obj
    payload.proofs = { ...payload.proofs, ...{ signature } };

    // fetch a credential from the API that fits the version, payload and passes the signature message challenge
    const { data } = await axios.post(`${iamUrl.replace(/\/+$/, "")}/v${payload.version}/verify`, {
      payload,
      challenge,
    });

    // return everything that was used to create the credential (along with the credential)
    return {
      signature,
      challenge,
      record: data.record as VerificationRecord,
      credential: data.credential as VerifiableCredential,
    };
  } else {
    // no address / signer
    return {
      credential: false,
    };
  }
};
