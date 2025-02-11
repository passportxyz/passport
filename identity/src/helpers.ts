import { Response } from "express";
import { IAMError } from "./verification.js";
import { generateKeyPairSync } from "crypto";

// return a JSON error response with a 400 status
export const errorRes = (res: Response, error: string | object, errorCode: number): Response =>
  res.status(errorCode).json({ error });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addErrorDetailsToMessage = (message: string, error: any): string => {
  if (error instanceof IAMError || error instanceof Error) {
    message += `, ${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    message += `, ${error}`;
  }
  return message;
};

export class ApiError extends Error {
  constructor(
    public message: string,
    public code: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnexpectedApiError extends ApiError {
  constructor(message: string) {
    super(message, 500);
    this.name = this.constructor.name;
  }
}

// Create an ordered array of the given input (of the form [[key:string, value:string], ...])
export const objToSortedArray = (obj: { [k: string]: string }): string[][] => {
  const keys: string[] = Object.keys(obj).sort();
  return keys.reduce((out: string[][], key: string) => {
    out.push([key, obj[key]]);
    return out;
  }, [] as string[][]);
};

export const generateEIP712PairJWK = () => {
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
