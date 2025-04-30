import { DID } from "dids";
import { getResolver } from "key-did-resolver";
import { CID } from "multiformats";
import { SignedDidChallenge } from "@gitcoin/passport-types";
import * as dagCBOR from "@ipld/dag-cbor";
import { encode } from "multiformats/block";
import { sha256 } from "multiformats/hashes/sha2";
import { Cacao } from "@didtools/cacao";
import { ApiError } from "./serverUtils/apiError.js";
import * as logger from "./logger.js";

class ChallengeMismatchError extends ApiError {
  constructor() {
    super("Verification failed, challenge mismatch", "401_UNAUTHORIZED");
    this.name = "ChallengeMismatchError";
  }
}

class InvalidSignatureError extends ApiError {
  constructor() {
    super("Verification failed, invalid signature", "401_UNAUTHORIZED");
    this.name = "InvalidSignatureError";
  }
}

class CredentialTooOldError extends ApiError {
  constructor() {
    super("Credential is too old", "401_UNAUTHORIZED");
    this.name = "CredentialTooOldError";
  }
}

const verifyMatchesExpectedChallenge = async (
  signedChallenge: SignedDidChallenge,
  expectedChallenge: string
): Promise<void> => {
  try {
    const expectedBlock = await encode({
      value: expectedChallenge,
      codec: dagCBOR,
      hasher: sha256,
    });

    const signedCID = CID.decode(new Uint8Array(signedChallenge.cid));

    if (expectedBlock.cid.toString() === signedCID.toString()) {
      return;
    }
  } catch {}

  throw new ChallengeMismatchError();
};

const verifySignature = async (signedChallenge: SignedDidChallenge, cacao: Cacao): Promise<void> => {
  try {
    const jws_restored = {
      signatures: signedChallenge.signatures,
      payload: signedChallenge.payload,
      cid: CID.decode(new Uint8Array(signedChallenge.cid)),
    };

    const did = new DID({
      resolver: getResolver(),
    });

    await did.verifyJWS(jws_restored, {
      issuer: signedChallenge.issuer,
      capability: cacao,
      disableTimecheck: true,
    });
  } catch {
    throw new InvalidSignatureError();
  }
};

const verifyAgeAndGetCacao = async (signedChallenge: SignedDidChallenge): Promise<Cacao> => {
  try {
    const cacao = await Cacao.fromBlockBytes(new Uint8Array(signedChallenge.cacao));
    // if (Date.now() - new Date(cacao.p.iat).getTime() < MAX_VALID_DID_SESSION_AGE) {
    return cacao;
    // }
  } catch (e) {
    logger.error(e);
  }
  throw new CredentialTooOldError();
};

export const verifyDidChallenge = async (
  signedChallenge: SignedDidChallenge,
  expectedChallenge: string
): Promise<string> => {
  const cacao = await verifyAgeAndGetCacao(signedChallenge);
  await verifyMatchesExpectedChallenge(signedChallenge, expectedChallenge);
  await verifySignature(signedChallenge, cacao);

  return signedChallenge.issuer.replace("did:pkh:eip155:1:", "");
};
