import { ComposeClient } from "@composedb/client";
// import type { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";

import { PassportLoadResponse, PROVIDER_ID, Stamp, StampPatch, VerifiableCredential } from "@gitcoin/passport-types";

import { CeramicStorage } from "./types";
import { definition as GitcoinPassportStampDefinition } from "@gitcoin/passport-schemas/dist/esm/gitcoin-passport-stamps";

const compose = new ComposeClient({
  ceramic: "http://localhost:7007",
  definition: GitcoinPassportStampDefinition,
});

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL = "https://ceramic-clay.3boxlabs.com";

// Instead of implementing the CeramicStorage interface, we could
// implement the DataStorageBase interface and this would be more flexible,
// but it's not necessary now

type PassportWrapperLoadResponse = {
  id: string;
  isDeleted: boolean;
  isRevoked: boolean;
  vc: VerifiableCredential;
};

export class ComposeDatabase implements CeramicStorage {
  did: string;

  constructor(did: DID) {
    compose.setDID(did);
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();
  }
  setStamps: (stamps: Stamp[]) => Promise<void>;
  deleteStampIDs: (streamIds: string[]) => Promise<void>;

  replaceKey(obj, oldKey, newKey) {
    const { [oldKey]: old, ...others } = obj;
    return { ...others, [newKey]: old };
  }

  formatCredentialInput = (stamp: Stamp) => {
    const { type, proof, credentialSubject, issuanceDate, expirationDate, issuer } = stamp.credential;
    if (!proof?.eip712Domain) {
      throw new Error("Invalid stamp");
    }
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

    return input;
  };

  addStamps = async (stamps: Stamp[]): Promise<PassportLoadResponse> => {
    console.log("geri add stamps: ", stamps);
    const vcResponses = [];
    const wrapperResponses = [];
    stamps.forEach(async (stamp) => {
      const input = this.formatCredentialInput(stamp);
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

      vcResponses.push(result);

      const vcID = result?.data?.createGitcoinPassportStamp?.document?.id;

      if (vcID) {
        const wrapperResponse = (await compose.executeQuery(
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

        wrapperResponses.push(wrapperResponse);
      }
    });

    console.log("add stamps response", { vcResponses, wrapperResponses });
    return {
      status: "Success",
    };
  };

  deleteStamps = async (providers: PROVIDER_ID[]): Promise<PassportLoadResponse> => {
    console.log("geri deleteStamps providers: ", providers);
    const existingPassport = await this.getPassportWithWrapper();

    const stampsToDelete = existingPassport.filter((stamp) =>
      providers.includes(stamp.vc.credentialSubject.provider as PROVIDER_ID)
    );

    stampsToDelete.map(async (stamp) => {
      await this.deleteStamp(stamp.id);
    });

    return {
      status: "Success",
    };
  };

  deleteStamp = async (streamId: string): Promise<PassportLoadResponse> => {
    console.log("geri deleteStamp providers: ", streamId);
    const deleteRequest = (await compose.executeQuery(
      `
      mutation SoftDeleteGitcoinStampWrapper($updateInput: UpdateGitcoinPassportStampWrapperInput!) {
        updateGitcoinPassportStampWrapper(input: $updateInput) {
          document {
            id
            isDeleted
            isRevoked
          }
        }
      }
    `,
      {
        updateInput: {
          id: streamId,
          content: {
            isDeleted: true,
          },
        },
      }
    )) as unknown as {
      data: {
        createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
      };
    };

    console.log("delete stamp response", { deleteRequest });

    return {
      status: "Success",
    };
  };

  findStreamId = (provider: PROVIDER_ID, wrappers: PassportWrapperLoadResponse[]): string => {
    const wrapper = wrappers.find((wrapper) => wrapper.vc.credentialSubject.provider === provider);
    if (!wrapper) {
      throw new Error("No wrapper found");
    }
    return wrapper.id;
  };

  patchStamps = async (stampPatches: StampPatch[]): Promise<PassportLoadResponse> => {
    // fetch non deleted and revoked stamps
    console.log("geri patchStamps providers: ", stampPatches);

    const existingPassport = await this.getPassportWithWrapper();

    const deleteRequests = await Promise.all(
      stampPatches
        .filter((stampPatch) => !stampPatch.credential)
        .map(async (stampPatch) => await this.deleteStamp(this.findStreamId(stampPatch.provider, existingPassport)))
    );

    const stampsToCreate = stampPatches
      .filter((stampPatch) => stampPatch.credential)
      .map((stampPatch) => ({
        provider: stampPatch.provider,
        credential: stampPatch.credential,
      }));

    const createRequest = await this.addStamps(stampsToCreate);

    console.log("patch response", { deleteRequests, createRequest });

    return {
      status: "Success",
    };
  };

  async getPassportWithWrapper(): Promise<PassportWrapperLoadResponse[]> {
    const result = (await compose.executeQuery(
      `
      query passport($amount: Int, $wrapperFilter: GitcoinPassportStampWrapperObjectFilterInput) {
        viewer {
          gitcoinPassportStampWrapperList(
            first: $amount
            filters: {where: $wrapperFilter}
          ) {
            edges {
              node {
                id
                isDeleted
                isRevoked
                vc {
                  ... on GitcoinPassportStamp {
                    id
                    issuer
                    type
                    _context
                    issuanceDate
                    expirationDate
                    credentialSubject {
                      hash
                      provider
                      _id
                      _context {
                        hash
                        provider
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
      {
        amount: 1000,
        wrapperFilter: {
          isDeleted: {
            equalTo: false,
          },
          isRevoked: {
            equalTo: false,
          },
        },
      }
    )) as unknown as {
      data: { viewer: { gitcoinPassportStampWrapperList: { edges: { node: PassportWrapperLoadResponse }[] } } };
    };
    const wrappers = (result?.data?.viewer?.gitcoinPassportStampWrapperList?.edges || []).map((edge) => edge.node);
    return wrappers;
  }

  // @notice: this function is not returning the full credential, only what is necessary to patch stamps
  async getPassport(): Promise<PassportLoadResponse> {
    // Implemented to comply with interface but not currently utilized outside of this class
    const passportWithWrapper = await this.getPassportWithWrapper();

    const stamps = passportWithWrapper.map((wrapper) => ({
      provider: wrapper.vc.credentialSubject.provider as PROVIDER_ID,
      credential: wrapper.vc,
    }));

    console.log({ stamps });
    return {
      status: "Success",
      passport: {
        stamps,
      },
    };
  }
}
