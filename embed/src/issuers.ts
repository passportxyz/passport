import * as DIDKit from "@spruceid/didkit-wasm-node";

const key = process.env.IAM_JWK;
const __issuer = DIDKit.keyToDID("key", key);
const eip712Key = process.env.IAM_JWK_EIP712;
const __eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);

const validIssuers = new Set([__issuer, __eip712Issuer]);

export function getEd25519IssuerKey(): string {
  return key;
}

export function getEd25519Issuer(): string {
  return __issuer;
}

export function getEip712IssuerKey(): string {
  return eip712Key;
}

export function getEip712Issuer(): string {
  return __eip712Issuer;
}

export function getIssuerKey(signatureType: string): string {
  return signatureType === "EIP712" ? eip712Key : key;
}

export function hasValidIssuer(issuer: string): boolean {
  return validIssuers.has(issuer);
}
