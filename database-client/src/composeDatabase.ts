import { ComposeClient } from "@composedb/client";
// import type { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";

import {
  PassportLoadResponse,
  PROVIDER_ID,
  Stamp,
  StampPatch,
  VerifiableCredential,
  VerifiableEip712CredentialComposeEncoded,
} from "@gitcoin/passport-types";

import { CeramicStorage } from "./types";
import { definition as GitcoinPassportStampDefinition } from "./compose-schema-definition";
import { GraphQLError } from "graphql";
import { Logger } from "./logger";
import { RuntimeCompositeDefinition } from "@composedb/types";

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL = "https://ceramic-clay.3boxlabs.com";

// Instead of implementing the CeramicStorage interface, we could
// implement the DataStorageBase interface and this would be more flexible,
// but it's not necessary now
type PassportWrapperLoadResponse = {
  id: string;
  vcID: string;
  isDeleted: boolean;
  isRevoked: boolean;
  vc: VerifiableEip712CredentialComposeEncoded;
};

export type GraphqlResponse<T> = {
  data: T;
  errors?: GraphQLError[];
};

export type AddVCResponse = { createGitcoinPassportStamp: { document: { id: string } } };
export type AddVCWrapperResponse = {
  createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
};
export type DeleteStampResponse = {
  createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
};
export type GetVCResponse = {
  viewer: { gitcoinPassportStampWrapperList: { edges: { node: PassportWrapperLoadResponse }[] } };
};

const formatCredentialFromCeramic = (
  encodedCredential: VerifiableEip712CredentialComposeEncoded
): VerifiableCredential => {
  const credential: VerifiableCredential = {
    "@context": encodedCredential._context,
    type: encodedCredential.type,
    credentialSubject: {
      "@context": encodedCredential.credentialSubject._context,
      id: encodedCredential.credentialSubject.id,
      hash: encodedCredential.credentialSubject.hash,
      provider: encodedCredential.credentialSubject.provider,
      // address: encodedCredential.credentialSubject.address,
      // challenge: encodedCredential.credentialSubject.challenge,
    },
    issuer: encodedCredential.issuer,
    issuanceDate: encodedCredential.issuanceDate,
    expirationDate: encodedCredential.expirationDate,
    proof: {
      "@context": encodedCredential.proof._context,
      type: encodedCredential.proof.type,
      proofPurpose: encodedCredential.proof.proofPurpose,
      proofValue: encodedCredential.proof.proofValue,
      verificationMethod: encodedCredential.proof.verificationMethod,
      created: encodedCredential.proof.created,
      eip712Domain: {
        domain: encodedCredential.proof.eip712Domain.domain,
        primaryType: encodedCredential.proof.eip712Domain.primaryType,
        types: {
          "@context": encodedCredential.proof.eip712Domain.types._context,
          // CredentialStatus: encodedCredential.proof.eip712Domain.types.CredentialStatus,
          CredentialSubject: encodedCredential.proof.eip712Domain.types.CredentialSubject,
          Document: encodedCredential.proof.eip712Domain.types.Document,
          EIP712Domain: encodedCredential.proof.eip712Domain.types.EIP712Domain,
          Proof: encodedCredential.proof.eip712Domain.types.Proof,
        },
      },
    },
  };
  return credential;
};

export class ComposeDatabase implements CeramicStorage {
  did: string;
  compose: ComposeClient;
  // logger should indicate with tag where error is coming from similar to: [Scorer]
  logger: Logger;

  constructor(did: DID, ceramicUrl: string = COMMUNITY_TESTNET_CERAMIC_CLIENT_URL, logger?: Logger) {
    if (logger) {
      this.logger = logger;
    } else {
      this.logger = console;
    }
    this.compose = new ComposeClient({
      ceramic: ceramicUrl,
      definition: GitcoinPassportStampDefinition as RuntimeCompositeDefinition,
    });
    this.compose.setDID(did);
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
        },
        proof: {
          ...proof,
          _context: proof["@context"],
          eip712Domain: {
            ...eip712Domain,
            types: {
              ...types,
              _context: types["@context"],
            },
          },
        },
      },
    };

    delete input.content.credentialSubject["@context"];
    delete input.content.proof["@context"];
    delete input.content.proof.eip712Domain.types["@context"];

    return input;
  };

  findStreamId = (provider: PROVIDER_ID, wrappers: PassportWrapperLoadResponse[]): string => {
    const wrapper = wrappers.find((wrapper) => wrapper.vc.credentialSubject.provider === provider);
    return wrapper?.id;
  };

  checkSettledResponse = (settledPromises: PromiseSettledResult<PassportLoadResponse>[]): PassportLoadResponse => {
    const errorDetails = settledPromises
      .filter((response): response is PromiseRejectedResult => response.status === "rejected")
      .map((response) => response.reason)
      .flat();

    if (errorDetails.length > 0) {
      return {
        status: "ExceptionRaised",
        errorDetails: {
          messages: errorDetails,
        },
      };
    }

    return {
      status: "Success",
    };
  };

  addStamp = async (stamp: Stamp): Promise<PassportLoadResponse> => {
    let vcID;
    const input = this.formatCredentialInput(stamp);
    const result = (await this.compose.executeQuery(
      `
        mutation CreateGitcoinPassportVc($input: CreateGitcoinPassportStampInput!) {
          createGitcoinPassportStamp(input: $input) {
            document {
              id
            }
          }
        }
        `,
      { input }
    )) as GraphqlResponse<{ createGitcoinPassportStamp: { document: { id: string } } }>;

    if (result.errors) {
      throw Error(
        `[ComposeDB] error thrown from mutation CreateGitcoinPassportVc, error: ${JSON.stringify(result.errors)}`
      );
    }

    vcID = result?.data?.createGitcoinPassportStamp?.document?.id;
    const wrapperRequest = (await this.compose.executeQuery(
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
    )) as GraphqlResponse<{
      createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
    }>;
    if (wrapperRequest.errors) {
      throw Error(
        `[ComposeDB] error thrown from mutation CreateGitcoinStampWrapper, vcID: ${vcID} error: ${JSON.stringify(
          wrapperRequest.errors
        )}`
      );
    }

    return {
      status: "Success",
    };
  };

  addStamps = async (stamps: Stamp[]): Promise<PassportLoadResponse> => {
    const vcPromises = stamps.map(async (stamp) => await this.addStamp(stamp));

    const addRequests = await Promise.allSettled(vcPromises);

    return this.checkSettledResponse(addRequests);
  };

  deleteStamp = async (streamId: string): Promise<PassportLoadResponse> => {
    const deleteRequest = (await this.compose.executeQuery(
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
    )) as GraphqlResponse<{
      createGitcoinPassportStampWrapper: { document: { id: string; isDeleted: boolean; isRevoked: boolean } };
    }>;

    if (deleteRequest.errors) {
      throw Error(`[ComposeDB] ${JSON.stringify(deleteRequest.errors)} for vcID: ${streamId}`);
    }

    return {
      status: "Success",
    };
  };

  deleteStamps = async (providers: PROVIDER_ID[]): Promise<PassportLoadResponse> => {
    const existingPassport = await this.getPassportWithWrapper();

    const stampsToDelete = existingPassport.filter((stamp) =>
      providers.includes(stamp.vc.credentialSubject.provider as PROVIDER_ID)
    );

    const deleteRequests = await Promise.allSettled(
      stampsToDelete.map(async (stamp) => await this.deleteStamp(stamp.id))
    );

    return this.checkSettledResponse(deleteRequests);
  };

  patchStamps = async (stampPatches: StampPatch[]): Promise<PassportLoadResponse> => {
    const deleteRequests = await this.deleteStamps(stampPatches.map((patch) => patch.provider));

    const stampsToCreate = stampPatches
      .filter((stampPatch) => stampPatch.credential)
      .map((stampPatch) => ({
        provider: stampPatch.provider,
        credential: stampPatch.credential,
      }));

    const createRequest = await this.addStamps(stampsToCreate);

    const errorDetails = [
      ...(deleteRequests?.errorDetails?.messages || []),
      ...(createRequest?.errorDetails?.messages || []),
    ];

    return {
      status: errorDetails.length > 0 ? "ExceptionRaised" : "Success",
      errorDetails: {
        messages: errorDetails,
      },
    };
  };

  async getPassportWithWrapper(): Promise<PassportWrapperLoadResponse[]> {
    const result = (await this.compose.executeQuery(
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
                vcID
                vc {
                  ... on GitcoinPassportStamp {
                    id
                    type
                    _context
                    expirationDate
                    issuanceDate
                    issuer
                    proof {
                      _context
                      created
                      eip712Domain {
                        domain {
                          name
                        }
                        primaryType
                        types {
                          _context {
                            name
                            type
                          }
                          CredentialSubject {
                            name
                            type
                          }
                          Document {
                            type
                            name
                          }
                          Proof {
                            name
                            type
                          }
                          EIP712Domain {
                            name
                            type
                          }
                        }
                      }
                      proofPurpose
                      proofValue
                      type
                      verificationMethod
                    }
                    credentialSubject {
                      _context {
                        hash
                        provider
                      }
                      hash
                      id
                      provider
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
    )) as GraphqlResponse<{
      viewer: { gitcoinPassportStampWrapperList: { edges: { node: PassportWrapperLoadResponse }[] } };
    }>;

    if (result.errors) {
      throw Error(String(result.errors));
    }

    const wrappers = (result?.data?.viewer?.gitcoinPassportStampWrapperList?.edges || []).map((edge) => edge.node);
    return wrappers;
  }

  async getPassport(): Promise<PassportLoadResponse> {
    try {
      const passportWithWrapper = await this.getPassportWithWrapper();
      const stamps = passportWithWrapper.map((wrapper) => ({
        provider: wrapper.vc.credentialSubject.provider as PROVIDER_ID,
        credential: formatCredentialFromCeramic(wrapper.vc),
      }));

      return {
        status: "Success",
        passport: {
          stamps,
        },
      };
    } catch (error) {
      return {
        status: "ExceptionRaised",
        errorDetails: {
          messages: [error.message],
        },
      };
    }
  }
}
