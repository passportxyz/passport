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

  replaceKey(obj, oldKey, newKey) {
    const { [oldKey]: old, ...others } = obj;
    return { ...others, [newKey]: old };
  }

  async setStamps(stamps: Stamp[]) {
    const existingStamps = await this.getPassport();

    // TODO: filter existing stamps and update/create new ones

    stamps.forEach(async (stamp) => {
      const { type, proof, credentialSubject, issuanceDate, expirationDate, issuer } = stamp.credential;
      const { eip712Domain } = proof;
      const { types } = eip712Domain;

      const input = {
        content: {
          _context: stamp.credential["@context"],
          issuer,
          issuanceDate,
          expirationDate,
          type,
          credentialSubject: {
            ...credentialSubject,
            _context: credentialSubject["@context"],
            _id: credentialSubject.id,
          },
          proof: {
            ...proof,
            _context: proof["@context"],
            eip712Domain: {
              ...eip712Domain,
              types: {
                ...types,
                Context: types["@context"],
              },
            },
          },
        },
      };

      delete input.content.credentialSubject.id;
      delete input.content.credentialSubject["@context"];
      delete input.content.proof["@context"];
      delete input.content.proof.eip712Domain.types["@context"];

      const result = (await compose.executeQuery(
        `
          mutation CreateGitcoinPassportVc($input: CreateGitcoinPassportStampInput!) {
            createGitcoinPassportStamp(input: $input) {
              document {
                id
              }
            }
          }
        `,
        {
          input,
        }
      )) as unknown as { data: { createGitcoinPassportStamp: { document: { id: string } } } };

      const vcID = result?.data?.createGitcoinPassportStamp?.document?.id;

      if (vcID) {
        (await compose.executeQuery(
          `
          mutation CreateGitcoinStampWrapper($wrapperInput: CreateGitcoinPassportStampWrapperInput!) {
            createGitcoinPassportStampWrapper(input: $wrapperInput) {
              document {
                id
                isDeleted
                isRevoked
              }
            }
          }
        `,
          {
            wrapperInput: {
              content: {
                vcID,
                isDeleted: false,
                isRevoked: false,
              },
            },
          }
        )) as unknown as {
          data: {
            createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
          };
        };
      }
    });
  }

  async getPassport(): Promise<PassportLoadResponse> {
    // Implemented to comply with interface but not currently utilized
    const result = await compose.executeQuery(
      `
      query myStamps($amount: Int) {
        viewer {
          # where: 
          # $validStamps
          # "validStamps": {
          #   "expirationDate": "100"
          # },
          gitcoinPassportStampList(first: $amount) { 
            edges {
              node {
                issuer
                id
              }
              
            }
          }
        }
      }
      `,
      {
        amount: 1000,
      }
    );
    console.log("result", result);
    return {
      status: "Success",
    };
  }
}
