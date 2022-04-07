// ---- Merkle methods
import { generateMerkle } from "./merkle";

// ---- Types
import {
  DIDKitLib,
  ProofRecord,
  RequestPayload,
  VerifiableCredential,
  IssuedCredential,
  IssuedChallenge,
  CredentialResponseBody,
  VerifiableCredentialRecord,
} from "@dpopp/types";
import { JsonRpcSigner } from "@ethersproject/providers";

// ---- Node/Browser http req library
import axios from "axios";

// utility to add a number of seconds to a date
const addSeconds = (date: Date, seconds: number): Date => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
};

// internal method to issue a verfiable credential
const _issueCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  expiresInSeconds: number,
  fields: { [k: string]: any } // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<VerifiableCredential> => {
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
  return JSON.parse(credential) as VerifiableCredential;
};

// Issue a VC with challenge data
export const issueChallengeCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  record: RequestPayload
): Promise<IssuedCredential> => {
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
  });

  // didkit-wasm-node returns credential as a string - parse for JSON
  return {
    credential,
  } as IssuedCredential;
};

// Return a verifiable credential with embedded merkle data
export const issueMerkleCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  record: ProofRecord
): Promise<IssuedCredential> => {
  // generate a merkleTree for the provided evidence
  const merkle = generateMerkle(record);
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
      root: merkle.root,
    },
  });

  // didkit-wasm-node returns credential as a string - parse for JSON
  return {
    credential,
  } as IssuedCredential;
};

// Verify that the provided credential is valid
export const verifyCredential = async (DIDKit: DIDKitLib, credential: VerifiableCredential): Promise<boolean> => {
  // extract expirationDate
  const { expirationDate, proof } = credential;
  // check that the credential is still valid
  if (new Date(expirationDate) > new Date()) {
    // parse the result of attempting to verify
    const verify = JSON.parse(
      await DIDKit.verifyCredential(JSON.stringify(credential), `{"proofPurpose":"${proof.proofPurpose}"}`)
    ) as { checks: string[]; warnings: string[]; errors: string[] };

    // did we get any errors when we attempted to verify?
    return verify?.errors?.length === 0;
  } else {
    // past expiry :(
    return false;
  }
};

// Fetch a verifiable challenge credential
export const fetchChallengeCredential = async (iamUrl: string, payload: RequestPayload): Promise<IssuedChallenge> => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl.replace(/\/+$/, "")}/v${payload.version}/challenge`,
    {
      payload: {
        address: payload.address,
        type: payload.type,
      },
    }
  );

  return {
    challenge: response.data.credential,
  } as IssuedChallenge;
};

// Fetch a verifiableCredential
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: RequestPayload,
  signer: JsonRpcSigner | undefined
): Promise<VerifiableCredentialRecord> => {
  // check for valid context
  if (payload.address && signer) {
    // first pull a challenge that can be signed by the user
    const { challenge } = await fetchChallengeCredential(iamUrl, payload);
    // sign the challenge provided by the IAM
    const signature = signer && (await signer.signMessage(challenge.credentialSubject.challenge)).toString();

    // pass the signature as part of the proofs obj
    payload.proofs = { ...payload.proofs, ...{ signature } };

    // fetch a credential from the API that fits the version, payload and passes the signature message challenge
    const response: { data: CredentialResponseBody } = await axios.post(
      `${iamUrl.replace(/\/+$/, "")}/v${payload.version}/verify`,
      {
        payload,
        challenge,
      }
    );

    // return everything that was used to create the credential (along with the credential)
    return {
      signature,
      challenge,
      record: response.data.record,
      credential: response.data.credential,
    } as VerifiableCredentialRecord;
  } else {
    // no address / signer
    throw new Error("Must provide signer and address");
  }
};
