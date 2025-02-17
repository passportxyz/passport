import * as DIDKit from "@spruceid/didkit-wasm-node";
import { NullifierGenerators } from "./credentials.js";
import { getKeyVersions } from "./keyManager.js";
import { HashNullifierGenerator } from "./nullifierGenerators.js";

export function getIssuerInfo(): {
  issuerKey: string;
  nullifierGenerators: NullifierGenerators;
} {
  const { active, issuer } = getKeyVersions();

  return {
    issuerKey: issuer.key,
    nullifierGenerators: active.map(({ key, version }) =>
      // TODO Add some variable like HUMAN_NETWORK_START_VERSION and
      // use it here to switch to HumanNetworkNullifierGenerators
      HashNullifierGenerator({ key, version })
    ) as NullifierGenerators,
  };
}

export function hasValidIssuer(issuer: string): boolean {
  const { initiated } = getKeyVersions();
  const initiatedIssuers = initiated.map(({ key }) => DIDKit.keyToDID("key", key));

  const validIssuers = new Set([...initiatedIssuers]);

  return validIssuers.has(issuer);
}
