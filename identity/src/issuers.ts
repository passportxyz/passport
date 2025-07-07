import * as DIDKit from "@spruceid/didkit-wasm-node";
import { NullifierGenerators } from "./credentials.js";
import { getKeyVersions } from "./keyManager.js";
import { HashNullifierGenerator, HumanNetworkNullifierGenerator } from "./nullifierGenerators.js";

const eip712keyToDID = (key: string) => DIDKit.keyToDID("ethr", key);

const HUMAN_NETWORK_START_VERSION = parseInt(process.env.HUMAN_NETWORK_START_VERSION);

const isInteger = (value: unknown): value is number => Number.isInteger(value);

export function getIssuerInfo(): {
  issuer: {
    key: string;
    did: string;
  };
  nullifierGenerators: NullifierGenerators;
} {
  const { active, issuer } = getKeyVersions();

  return {
    issuer: {
      key: issuer.key,
      did: eip712keyToDID(issuer.key),
    },
    nullifierGenerators: active.map(({ key, version }) =>
      isInteger(version) && version >= HUMAN_NETWORK_START_VERSION
        ? HumanNetworkNullifierGenerator({
            localSecret: key,
            version,
          })
        : HashNullifierGenerator({ key, version })
    ) as NullifierGenerators,
  };
}

export function hasValidIssuer(issuerDid: string): boolean {
  const { initiated } = getKeyVersions();

  const initiatedIssuerDids = initiated.map(({ key }) => eip712keyToDID(key));

  const validIssuerDids = new Set([...initiatedIssuerDids]);

  return validIssuerDids.has(issuerDid);
}
