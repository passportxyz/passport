import { ComposeClient } from "@composedb/client";
import type { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";

import { Stamp } from "@gitcoin/passport-types";

import { CeramicStorage } from "./types";
import { definition as GitcoinPassportStampDefinition } from "@gitcoin/passport-schemas/definitions/gitcoin-passport-stamps";

const compose = new ComposeClient({
  ceramic: "http://localhost:7007",
  definition: GitcoinPassportStampDefinition,
});

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL = "https://ceramic-clay.3boxlabs.com";

// Instead of implementing the CeramicStorage interface, we could
// implement the DataStorageBase interface and this would be more flexible,
// but it's not necessary now

export class ComposeDatabase implements CeramicStorage {
  did: string;

  constructor(did: DID) {
    compose.setDID(did);
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();
  }

  async deleteStampIDs(_streamIds: string[]) {
    // ComposeDB doesn't support deleting records yet
    // Once we remove the old ceramic code, we could just
    // drop this function from here and the interface definition
  }

  async setStamps(stamps: Stamp[]) {
    stamps.forEach(async (stamp) => {
      console.log("stamp", stamp);
      const result = await compose.executeQuery(
        `
        mutation CreateGitcoinPassportVc($input: CreateGitcoinPassportVcInput!) {
          createGitcoinPassportVc(input: $input) {
            document {
              id

            }
          }
        }`,
        {
          input: {
            content: {
              issuer: stamp.credential.issuer,
              issuanceDate: stamp.credential.issuanceDate,
              expirationDate: stamp.credential.expirationDate,
              type: stamp.credential.type,
              credentialSubject: {
                id: stamp.credential.credentialSubject.id,
                provider: stamp.credential.credentialSubject.provider,
                metaPointer: stamp.credential.credentialSubject.metaPointer,
                hash: stamp.credential.credentialSubject.hash,
              },
            },
          },
        }
      );
      console.log("result", result);
    });
  }
}
