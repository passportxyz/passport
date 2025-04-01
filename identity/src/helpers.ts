import { generateKeyPairSync } from "crypto";

// Temporary helper function to determine if we should use the new format
export const checkRotatingKeysEnabled = (): boolean => process.env.FF_ROTATING_KEYS === "on";

// Create an ordered array of the given input (of the form [[key:string, value:string], ...])
export const objToSortedArray = (obj: { [k: string]: string }): string[][] => {
  const keys: string[] = Object.keys(obj).sort();
  return keys.reduce((out: string[][], key: string) => {
    out.push([key, obj[key]]);
    return out;
  }, [] as string[][]);
};

export const generateEIP712PairJWK = (): string => {
  const keyPair = generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
  });

  const publicJwk = keyPair.publicKey.export({
    format: "jwk",
  });

  const privateJwk = keyPair.privateKey.export({
    format: "jwk",
  });

  const jwk = {
    ...publicJwk,
    d: privateJwk.d,
    use: "sig",
    alg: "ES256K",
  };

  return JSON.stringify(jwk);
};
