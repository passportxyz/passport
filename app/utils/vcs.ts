import { OnChainVerifiableEip712Credential, VerifiableEip712Credential } from "@gitcoin/passport-types";
import { ethers } from "ethers";

export const formatEIP712CompatibleCredential = (
  credential: VerifiableEip712Credential
): OnChainVerifiableEip712Credential => {
  const { proof } = credential;
  const encodedCredential: OnChainVerifiableEip712Credential = {
    _context: credential["@context"],
    _type: credential.type,
    credentialSubject: {
      id: credential.credentialSubject.id,
      _context: {
        _hash: credential.credentialSubject["@context"].hash,
        provider: credential.credentialSubject["@context"].provider,
      },
      _hash: credential.credentialSubject.hash,
      provider: credential.credentialSubject.provider,
    },
    issuer: credential.issuer,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    proof: {
      _context: proof["@context"],
      _type: proof.type,
      proofPurpose: proof.proofPurpose,
      proofValue: proof.proofValue,
      verificationMethod: proof.verificationMethod,
      created: proof.created,
      eip712Domain: proof.eip712Domain,
    },
  };
  return encodedCredential;
};

export const getCredentialSplitSignature = (
  credential: VerifiableEip712Credential
): { v: number; r: string; s: string } => {
  const { proof } = credential;
  const { v, r, s } = ethers.Signature.from(proof.proofValue);
  return { v, r, s };
};
