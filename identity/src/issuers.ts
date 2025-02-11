import * as DIDKit from "@spruceid/didkit-wasm-node";
import { NullifierGenerators } from "credentials.js";
import { getCurrentKeys } from "keyManager.js";
import { HashNullifierGenerator } from "nullifierGenerators.js";

const key = process.env.IAM_JWK;
const __issuer = DIDKit.keyToDID("key", key);
const eip712Key = process.env.IAM_JWK_EIP712;
const __eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);

export function getIssuerInfo(signatureType: string): {
  issuerKey: string;
  nullifierGenerators: NullifierGenerators;
} {
  if (signatureType === "EIP712") {
    const keyVersions = getCurrentKeys();
    return {
      // TODO is it first or last? And probably sort by version here?
      issuerKey: keyVersions[0].key,
      nullifierGenerators: keyVersions.map(({ key, version }) =>
        HashNullifierGenerator({ key, version })
      ) as NullifierGenerators,
    };
  } else {
    return {
      issuerKey: key,
      nullifierGenerators: [HashNullifierGenerator({ key, version: "0.0.0" })],
    };
  }
}

export function hasValidIssuer(issuer: string): boolean {
  const validIssuers = new Set([__issuer, __eip712Issuer, ...getCurrentKeys().map(({ key }) => key)]);

  return validIssuers.has(issuer);
}
