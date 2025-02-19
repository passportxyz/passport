import * as DIDKit from "@spruceid/didkit-wasm-node";
import { NullifierGenerators } from "./credentials.js";
import { getKeyVersions } from "./keyManager.js";
import { HashNullifierGenerator } from "./nullifierGenerators.js";

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
      did: DIDKit.keyToDID("key", issuer.key),
    },
    nullifierGenerators: active.map(({ key, version }) =>
      // TODO Add some variable like HUMAN_NETWORK_START_VERSION and
      // use it here to switch to HumanNetworkNullifierGenerators
      HashNullifierGenerator({ key, version }),
    ) as NullifierGenerators,
  };
}

export function hasValidIssuer(issuerDid: string): boolean {
  const { initiated } = getKeyVersions();
  const initiatedIssuerDids = initiated.map(({ key }) =>
    DIDKit.keyToDID("key", key),
  );

  const validIssuerDids = new Set([...initiatedIssuerDids]);

  return validIssuerDids.has(issuerDid);
}
