// --- Types
import { ProofRecord } from "@gitcoin/passport-types";

// --- Base64 encoding
import * as base64 from "@ethersproject/base64";

// --- Crypto lib for hashing
import { createHash } from "crypto";
import { objToSortedArray } from "./helpers.js";
import { humanNetworkOprf } from "./humanNetworkOprf.js";
import * as logger from "./logger.js";

export type NullifierGenerator = ({ record }: { record: ProofRecord }) => Promise<string>;

const HUMAN_NETWORK_TIMEOUT_MS = process.env.HUMAN_NETWORK_TIMEOUT_MS
  ? parseInt(process.env.HUMAN_NETWORK_TIMEOUT_MS)
  : 5000;

// Percent of credentials in which to use the new human network nullifier
const HUMAN_NETWORK_NULLIFIER_PERCENT =
  process.env.HUMAN_NETWORK_NULLIFIER_PERCENT && parseInt(process.env.HUMAN_NETWORK_NULLIFIER_PERCENT);

// Used during roll out of new nullifier generators
export class IgnorableNullifierGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IgnorableNullifierGeneratorError";
  }
}

type NullifierVersion = number | "0.0.0";

type HashNullifierGeneratorOptions = {
  key: string;
  version: NullifierVersion;
};

const hashValueWithSecret = ({ secret, value }: { secret: string; value: string }) =>
  base64.encode(createHash("sha256").update(secret, "utf-8").update(value, "utf-8").digest());

/*
  Example usage:

    {
      ...
      nullifierGenerators: [
        HashNullifierGenerator({ key: privateKey, version: 1 }),
        HumanNetworkNullifierGenerator({ clientPrivateKey: humanNetworkKey, relayUrl, localSecret: privateKey, version: 1 }),
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

type HumanNetworkNullifierGeneratorOptions = {
  localSecret: string;
  version: NullifierVersion;
};

class NullifierTimeoutError extends Error {
  constructor() {
    super("Timeout generating nullifier");
    this.name = "NullifierTimeoutError";
  }
}

const withTimeout = async <T>(timeout: number, promise: Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new NullifierTimeoutError());
    }, timeout);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

const createHumanNetworkNullifier = async ({
  localSecret,
  version,
  record,
}: HumanNetworkNullifierGeneratorOptions & { record: ProofRecord }) => {
  const startTime = Date.now();

  const value = JSON.stringify(objToSortedArray(record));

  const humanNetworkEncrypted = await humanNetworkOprf({
    value,
  });

  const hashedValue = hashValueWithSecret({
    secret: localSecret,
    value: humanNetworkEncrypted,
  });

  const duration = Date.now() - startTime;
  logger.info(`Human network nullifier: ${duration}ms`);

  return `v${version}:${hashedValue}`;
};

export const HumanNetworkNullifierGenerator =
  (humanNetworkOps: HumanNetworkNullifierGeneratorOptions): NullifierGenerator =>
  async ({ record }) => {
    limitExecution(HUMAN_NETWORK_NULLIFIER_PERCENT);
    try {
      return await withTimeout(
        HUMAN_NETWORK_TIMEOUT_MS,
        createHumanNetworkNullifier({
          ...humanNetworkOps,
          record,
        })
      );
    } catch (e) {
      // For now, ignore errors with humanNetwork
      // TODO remove this once beta testing is complete
      logger.error("Error generating humanNetwork nullifier (ignoring): ", e);
      throw new IgnorableNullifierGeneratorError("Error generating humanNetwork nullifier");
    }
  };

const limitExecution = (integerProbabilityToExecute?: number) => {
  if (integerProbabilityToExecute === undefined) return;

  // Integer in [1, 100]
  const randomValue = Math.floor(Math.random() * 100) + 1;
  if (randomValue > integerProbabilityToExecute) {
    throw new IgnorableNullifierGeneratorError("Limiting execution of nullifier generator");
  }
};
