// --- Types
import { ProofRecord } from "@gitcoin/passport-types";

// --- Base64 encoding
import * as base64 from "@ethersproject/base64";

// --- Crypto lib for hashing
import { createHash } from "crypto";
import { objToSortedArray } from "./helpers.js";
import { mishtiOprf } from "./mishtiOprf.js";

export type NullifierGenerator = ({ record }: { record: ProofRecord }) => Promise<string>;

type NullifierVersion = number | "0.0.0";

const hashValueWithSecret = ({ secret, value }: { secret: string; value: string }) =>
  base64.encode(createHash("sha256").update(secret, "utf-8").update(value, "utf-8").digest());

type HashNullifierGeneratorOptions = {
  key: string;
  version: NullifierVersion;
};

/*
  Example usage:

    {
      ...
      nullifierGenerators: [
        HashNullifierGenerator({ key: privateKey, version: 1 }),
        MishtiNullifierGenerator({ clientPrivateKey: mishtiKey, relayUrl, localSecret: privateKey, version: 1 }),
      ];
    }

*/

export const HashNullifierGenerator =
  ({ key, version }: HashNullifierGeneratorOptions): NullifierGenerator =>
  ({ record }) => {
    // Generate a hash like SHA256(IAM_PRIVATE_KEY+PII), where PII is the (deterministic) JSON representation
    // of the PII object after transforming it to an array of the form [[key:string, value:string], ...]
    // with the elements sorted by key
    const value = JSON.stringify(objToSortedArray(record));
    const hashedRecord = hashValueWithSecret({ secret: key, value });
    return Promise.resolve(`v${version}:${hashedRecord}`);
  };

type MishtiNullifierGeneratorOptions = {
  clientPrivateKey: string;
  relayUrl: string;
  localSecret: string;
  version: NullifierVersion;
};

export const MishtiNullifierGenerator =
  ({ localSecret, version, ...mishtiOps }: MishtiNullifierGeneratorOptions): NullifierGenerator =>
  async ({ record }) => {
    const value = JSON.stringify(objToSortedArray(record));
    const mishtiEncrypted = await mishtiOprf({
      value,
      ...mishtiOps,
    });
    const hashed = hashValueWithSecret({ secret: localSecret, value: mishtiEncrypted });

    return `v${version}:${hashed}`;
  };
