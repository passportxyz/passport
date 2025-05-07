// --- Types
import {
  DIDKitLib,
  ProofRecord,
  RequestPayload,
  VerifiableCredential,
  IssuedCredential,
} from "@gitcoin/passport-types";

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
export const MAX_VALID_DID_SESSION_AGE = ONE_DAY_IN_MS;

// EIP712 document types
import {
  DocumentSignatureTypes,
  challengeSignatureDocument,
  DocumentType,
  stampCredentialDocument,
} from "./signingDocuments.js";
import { IgnorableNullifierGeneratorError, NullifierGenerator } from "./nullifierGenerators.js";
import { checkRotatingKeysEnabled } from "./helpers.js";
import * as logger from "./logger.js";

// Control expiry times of issued credentials
export const CHALLENGE_EXPIRES_AFTER_SECONDS = 60; // 1min
export const CREDENTIAL_EXPIRES_AFTER_SECONDS = 90 * 86400; // 90days

// utility to add a number of seconds to a date
const addSeconds = (date: Date, seconds: number): Date => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
};

type CredentialExpiresInSeconds = {
  expiresInSeconds: number;
};

type CredentialExpiresAt = {
  expiresAt: Date;
};

type Eip712CredentialSubject = {
  "@context": object;
  [k: string]: unknown;
};

type Eip712CredentialFields = {
  credentialSubject: Eip712CredentialSubject;
};

export const issueEip712Credential = async (
  DIDKit: DIDKitLib,
  key: string,
  expiration: CredentialExpiresInSeconds | CredentialExpiresAt,
  // fields: { [k: string]: any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  fields: Eip712CredentialFields,
  signingDocument: DocumentSignatureTypes<DocumentType>,
  additionalContexts: string[] = []
): Promise<VerifiableCredential> => {
  // get DID from key

  const issuer = DIDKit.keyToDID("ethr", key);

  const expiresInSeconds = (expiration as CredentialExpiresInSeconds).expiresInSeconds;
  const expirationDate =
    expiresInSeconds !== undefined
      ? addSeconds(new Date(), expiresInSeconds).toISOString()
      : (expiration as CredentialExpiresAt).expiresAt.toISOString();
  const credentialInput = {
    "@context": ["https://www.w3.org/2018/credentials/v1", ...additionalContexts],
    type: ["VerifiableCredential"],
    issuer,
    issuanceDate: new Date().toISOString(),
    expirationDate,
    ...fields,
  };

  const options = signingDocument;
  const credential = await DIDKit.issueCredential(JSON.stringify(credentialInput), JSON.stringify(options), key);

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
  const verificationMethod = await DIDKit.keyToVerificationMethod("ethr", key);

  const credential = await issueEip712Credential(
    DIDKit,
    key,
    { expiresInSeconds: CHALLENGE_EXPIRES_AFTER_SECONDS },
    {
      credentialSubject: {
        "@context": {
          provider: "https://schema.org/Text",
          challenge: "https://schema.org/Text",
          address: "https://schema.org/Text",
        },

        id: `did:pkh:eip155:1:${record.address}`,
        provider: `challenge-${record.type}`,
        // extra fields to convey challenge data
        challenge: record.challenge,
        address: record.address,
      },
    },
    challengeSignatureDocument(verificationMethod)
  );

  // didkit-wasm-node returns credential as a string - parse for JSON
  return {
    credential,
  } as IssuedCredential;
};

// At least one
export type NullifierGenerators = [NullifierGenerator, ...NullifierGenerator[]];

const getNullifiers = async ({
  record,
  nullifierGenerators,
}: {
  record: ProofRecord;
  nullifierGenerators: NullifierGenerators;
}): Promise<string[]> => {
  const nullifierPromiseResults = await Promise.allSettled(nullifierGenerators.map((g) => g({ record })));

  const unexpectedErrors = nullifierPromiseResults
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .filter((result) => !(result.reason instanceof IgnorableNullifierGeneratorError));

  if (unexpectedErrors.length > 0) {
    logger.error("Unexpected errors generating nullifiers", unexpectedErrors);
    throw new Error("Unable to generate nullifiers");
  }

  const nullifiers = nullifierPromiseResults
    .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
    .map((result) => result.value);

  if (nullifiers.length === 0) {
    throw new Error("No valid nullifiers generated");
  }

  return nullifiers;
};

// Return a verifiable credential with embedded nullifier(s)
export const issueNullifiableCredential = async ({
  DIDKit,
  issuerKey,
  address,
  record,
  nullifierGenerators,
  expiresInSeconds = CREDENTIAL_EXPIRES_AFTER_SECONDS,
}: {
  DIDKit: DIDKitLib;
  issuerKey: string;
  address: string;
  record: ProofRecord;
  nullifierGenerators: NullifierGenerators;
  expiresInSeconds: number;
  signatureType?: string;
}): Promise<IssuedCredential> => {
  const nullifiers = await getNullifiers({ record, nullifierGenerators });
  const legacy = !checkRotatingKeysEnabled();

  const verificationMethod = await DIDKit.keyToVerificationMethod("ethr", issuerKey);
  // generate a verifiableCredential
  const credential = await issueEip712Credential(
    DIDKit,
    issuerKey,
    { expiresInSeconds },
    {
      credentialSubject: {
        "@context": {
          ...(legacy
            ? {
                hash: "https://schema.org/Text",
              }
            : {
                nullifiers: {
                  "@container": "@list",
                  "@type": "https://schema.org/Text",
                },
              }),
          provider: "https://schema.org/Text",
        },

        // construct a pkh DID on mainnet (:1) for the given wallet address
        id: `did:pkh:eip155:1:${address}`,
        provider: record.type,
        ...(legacy
          ? {
              hash: nullifiers[0],
            }
          : {
              nullifiers,
            }),
      },
      // https://www.w3.org/TR/vc-status-list/#statuslist2021entry
      // Can be added to support revocation
      // credentialStatus: {
      //   id: "",
      //   type: "StatusList2021Entry",
      //   statusPurpose: "revocation",
      //   statusListIndex: "",
      //   statusListCredential: "",
      // },
    },
    stampCredentialDocument(verificationMethod, legacy),
    ["https://w3id.org/vc/status-list/2021/v1"]
  );

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
    try {
      // parse the result of attempting to verify
      const verify = JSON.parse(
        await DIDKit.verifyCredential(JSON.stringify(credential), `{"proofPurpose":"${proof?.proofPurpose}"}`)
      ) as { checks: string[]; warnings: string[]; errors: string[] };

      // did we get any errors when we attempted to verify?
      return verify.errors.length === 0;
    } catch (e) {
      // if didkit throws, etc.
      return false;
    }
  } else {
    // past expiry :(
    return false;
  }
};
