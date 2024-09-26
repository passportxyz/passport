import { OnChainVerifiableEip712Credential, VerifiableCredential } from "@gitcoin/passport-types";



export const formatEIP712CompatibleCredential = (
  credential: VerifiableCredential
): OnChainVerifiableEip712Credential => {
const {proof} = credential
  const encodedCredential = {
    _context: credential['@context'],
    _type: credential.type,
    credentialSubject: {
      _context: credential.credentialSubject['@context'],
      id: credential.credentialSubject.id,
      _hash: credential.credentialSubject.hash,
      provider: credential.credentialSubject.provider,
    },
    issuer: credential.issuer,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    proof: {
        _context: proof.;
        _type: string;
        proofPurpose: string;
        proofValue: string;
        verificationMethod: string;
        created: string;
        eip712Domain: {
          domain: {
            name: string;
          };
          primaryType: string;
          types: {
            [key: string]: {
              name: string;
              type: string;
            }[];
          };
        };
      };
  };
  return encodedCredential;
};

export const useVCNormalization = () => {
  return {
    formatCredentialFromCeramic,
    formatCredentialForCeramic,
  };
};