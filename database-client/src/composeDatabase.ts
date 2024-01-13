import { ComposeClient } from "@composedb/client";
// import type { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";

import { PassportLoadResponse, Stamp } from "@gitcoin/passport-types";

import { CeramicStorage } from "./types";
import { definition as GitcoinPassportStampDefinition } from "./gitcoin-passport-stamps";

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
      const { type, proof, credentialSubject, issuanceDate, expirationDate, issuer } = stamp.credential;

      const input = {
        content: {
          _context: stamp.credential["@context"],
          issuer,
          issuanceDate,
          expirationDate,
          type,
          credentialSubject: {
            _context: credentialSubject["@context"],
            ...credentialSubject,
          },
          proof,
        },
      };

      console.log({ input });

      const result = await compose.executeQuery(
        `
        mutation CreateGitcoinPassportVc($input: CreateGitcoinPassportStampInput!) {
          createGitcoinPassportStamp(input: $input) {
            document {
              id
            }
          }
        }`,
        {
          input,
        }
      );
      console.log("result", result);
    });
  }

  async getPassport(): Promise<PassportLoadResponse> {
    // Implemented to comply with interface but not currently utilized
    // const result = await compose.executeQuery(
    //   `
    //   query GetGitcoinPassportVcs($input: GetGitcoinPassportVcsInput!) {
    //     getGitcoinPassportVcs(input: $input) {
    //       document {
    //         id
    //         content {
    //           issuer
    //           issuanceDate
    //           expirationDate
    //           type
    //           credentialSubject {
    //             id
    //             provider
    //             metaPointer
    //             hash
    //           }
    //         }
    //       }
    //     }
    //   }`,
    //   {
    //     input: {
    //       where: {
    //         issuer: this.did,
    //       },
    //     },
    //   }
    // );
    // console.log("result", result);
    return {
      status: "ExceptionRaised",
    };
  }
}
