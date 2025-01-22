import { ComposeClient } from "@composedb/client";
import { DID } from "dids";

import {
  PassportLoadResponse,
  PROVIDER_ID,
  Stamp,
  StampPatch,
  VerifiableCredential,
  VerifiableEip712CredentialComposeEncoded,
  SecondaryStorageAddResponse,
  SecondaryStorageDeleteResponse,
  SecondaryStorageBulkPatchResponse,
} from "@gitcoin/passport-types";

import { definition as GitcoinPassportStampDefinition } from "@gitcoin/passport-schemas";
import { GraphQLError } from "graphql";
import { Logger } from "./logger";
import { WriteOnlySecondaryDataStorageBase } from "./types";
import { RuntimeCompositeDefinition } from "@composedb/types";

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL = "https://ceramic-clay.3boxlabs.com";

export type PassportWrapperLoadResponse = {
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

export class ComposeDatabase implements WriteOnlySecondaryDataStorageBase {
  did: string;
  composeImpl: ComposeDatabaseImpl;
  lastOp: Promise<any> = Promise.resolve();

  constructor(did: DID, ceramicUrl: string = COMMUNITY_TESTNET_CERAMIC_CLIENT_URL, logger?: Logger) {
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();
    this.composeImpl = new ComposeDatabaseImpl(did, ceramicUrl, logger);
  }

  addStamps = async (stamps: Stamp[]): Promise<SecondaryStorageAddResponse[]> => {
    const op = this.lastOp.then(async () => {
      await this.composeImpl.getPassportWithWrapper();
      const promiseToReturn = this.composeImpl.addStamps(stamps);
      return promiseToReturn;
    });
    this.lastOp = op;
    return op;
  };

  patchStamps = async (stampPatches: StampPatch[]): Promise<SecondaryStorageBulkPatchResponse> => {
    const op = this.lastOp.then(async () => {
      // No need to call this.composeImpl.getPassportWithWrapper(); as it is already called because deleteStamps in patchStamps function
      const promiseToReturn = this.composeImpl.patchStamps(stampPatches);
      return promiseToReturn;
    });
    this.lastOp = op;
    return op;
  };

  deleteStamps = async (providers: PROVIDER_ID[]): Promise<SecondaryStorageDeleteResponse[]> => {
    const op = this.lastOp.then(async () => {
      // No need to call this.composeImpl.getPassportWithWrapper(); as it is already called in the deleteStamps function
      const promiseToReturn = this.composeImpl.deleteStamps(providers);
      return promiseToReturn;
    });
    this.lastOp = op;
    return op;
  };

  getPassport = async (): Promise<PassportLoadResponse> => {
    return this.composeImpl.getPassport();
  };
}

export class ComposeDatabaseImpl implements WriteOnlySecondaryDataStorageBase {
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

  checkSettledResponse = <T>(settledPromises: PromiseSettledResult<T>[]): T[] => {
    const errorDetails = settledPromises
      .filter((response): response is PromiseRejectedResult => response.status === "rejected")
      .map((response) => response.reason)
      .flat();

    if (errorDetails.length > 0) {
      const aggregateErrorMessage = errorDetails.map((e) => `${e.name}: ${e.message}\n${e.stack}`);
      throw Error(aggregateErrorMessage.join("\n"));
    }

    return settledPromises
      .filter((response): response is PromiseFulfilledResult<T> => response.status === "fulfilled")
      .map((response) => response.value);
  };

  addStamp = async (stamp: Stamp): Promise<SecondaryStorageAddResponse> => {
    this.logger.info(`[ComposeDB][addStamp] ${this.did} adding stamp`);

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

    let secondaryStorageError: string | undefined;
    let streamId: string | undefined;
    if (result.errors) {
      secondaryStorageError = `[ComposeDB] error from mutation CreateGitcoinPassportVc, error: ${JSON.stringify(
        result.errors
      )}`;

      console.error(`[ComposeDB][addStamp] ${this.did} failed to add stamp ${secondaryStorageError}`);
      this.logger.error(`[ComposeDB][addStamp] ${this.did} failed to add stamp`, { error: result.errors });
    } else {
      vcID = result?.data?.createGitcoinPassportStamp?.document?.id;

      if (vcID) {
        this.logger.info(`[ComposeDB][addStamp] ${this.did} adding stamp wrapper`);
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

        streamId = wrapperRequest?.data?.createGitcoinPassportStampWrapper?.document?.id;

        if (wrapperRequest.errors) {
          secondaryStorageError = `[ComposeDB] error thrown from mutation CreateGitcoinStampWrapper, vcID: ${vcID} error: ${JSON.stringify(
            wrapperRequest.errors
          )}`;
          console.error(`[ComposeDB][addStamp] ${this.did} ${secondaryStorageError}`);
          this.logger.error(`[ComposeDB][addStamp] ${this.did} failed to add stamp wrapper`, {
            error: wrapperRequest.errors,
          });
        } else if (!streamId) {
          secondaryStorageError = `[ComposeDB] For vcID: ${vcID} error: streamId=${streamId}`;
          console.error(`[ComposeDB][addStamp] ${this.did} ${secondaryStorageError}`);
          this.logger.error(`[ComposeDB][addStamp] ${this.did} ${secondaryStorageError}`);
        }
      } else {
        secondaryStorageError = `[ComposeDB] error: streamId=${vcID}`;
        console.error(`[ComposeDB][addStamp] ${this.did} ${secondaryStorageError}`);
        this.logger.error(`[ComposeDB][addStamp] ${this.did} ${secondaryStorageError}`);
      }
    }

    return {
      provider: stamp.credential.credentialSubject.provider as PROVIDER_ID,
      secondaryStorageId: streamId,
      secondaryStorageError,
    };
  };

  addStamps = async (stamps: Stamp[]): Promise<SecondaryStorageAddResponse[]> => {
    console.log(`[ComposeDB] ${this.did} addStamps:`, { stamps });
    this.logger.info(`[ComposeDB] ${this.did} addStamps`, { stamps });

    const vcPromises = stamps.map(async (stamp) => await this.addStamp(stamp));

    const addRequests = await Promise.allSettled(vcPromises);

    const ret = this.checkSettledResponse(addRequests);
    console.log(`[ComposeDB] ${this.did} addStamps ret:`, { ret });
    this.logger.info(`[ComposeDB] ${this.did} addStamps ret`, { ret });
    return ret;
  };

  deleteStamp = async (streamId: string): Promise<SecondaryStorageDeleteResponse> => {
    this.logger.info(`[ComposeDB][deleteStamp] ${this.did} deleting stamp with streamId: ${streamId}`);

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

    let secondaryStorageError: string | undefined;
    if (deleteRequest.errors) {
      secondaryStorageError = `[ComposeDB] ${JSON.stringify(deleteRequest.errors)} for vcID: ${streamId}`;
      console.error(`[ComposeDB][deleteStamp] ${this.did} error`, deleteRequest.errors);
      this.logger.error(`[ComposeDB][deleteStamp] ${this.did} error`, { error: deleteRequest.errors });
    }

    return {
      secondaryStorageId: streamId,
      secondaryStorageError,
    };
  };

  deleteStamps = async (providers: PROVIDER_ID[]): Promise<SecondaryStorageDeleteResponse[]> => {
    console.log(`[ComposeDB] ${this.did} deleteStamps:`, { providers });
    this.logger.info(`[ComposeDB] ${this.did} deleteStamps`, { providers });

    const existingPassport = await this.getPassportWithWrapper();

    const stampsToDelete = existingPassport.filter((stamp) =>
      providers.includes(stamp.vc.credentialSubject.provider as PROVIDER_ID)
    );

    const deleteRequests = await Promise.allSettled(
      stampsToDelete.map(async (stamp) => await this.deleteStamp(stamp.id))
    );

    const ret = this.checkSettledResponse(deleteRequests);
    console.log(`[ComposeDB] ${this.did} deleteStamps ret:`, { ret });
    this.logger.info(`[ComposeDB] ${this.did} deleteStamps ret`, { ret });
    return ret;
  };

  patchStamps = async (stampPatches: StampPatch[]): Promise<SecondaryStorageBulkPatchResponse> => {
    console.log(`[ComposeDB] ${this.did} patchStamps:`, stampPatches);
    this.logger.info(`[ComposeDB] ${this.did} patchStamps`, { stampPatches });

    const deleteResponses = await this.deleteStamps(stampPatches.map((patch) => patch.provider));
    console.log(`[ComposeDB] ${this.did} patchStamps deleteResponses:`, deleteResponses);
    this.logger.info(`[ComposeDB] ${this.did} patchStamps deleteResponses`, { deleteResponses });

    const stampsToCreate = stampPatches
      .filter((stampPatch) => stampPatch.credential)
      .map((stampPatch) => ({
        provider: stampPatch.provider,
        credential: stampPatch.credential,
      }));
    console.log(`[ComposeDB] ${this.did} patchStamps stampsToCreate:`, stampsToCreate);
    this.logger.info(`[ComposeDB] ${this.did} patchStamps stampsToCreate`, { stampsToCreate });

    const addResponses = await this.addStamps(stampsToCreate);
    console.log(`[ComposeDB] ${this.did} patchStamps addResponses:`, addResponses);
    this.logger.info(`[ComposeDB] ${this.did} patchStamps addResponses`, { addResponses });

    return {
      adds: addResponses,
      deletes: deleteResponses,
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
    console.log(`[ComposeDB] ${this.did} getPassportWithWrapper returns`, wrappers);
    this.logger.info(`[ComposeDB] ${this.did} getPassportWithWrapper returns`, { wrappers });
    return wrappers;
  }

  async getPassport(): Promise<PassportLoadResponse> {
    try {
      console.log(`[ComposeDB] ${this.did} getPassport`);
      this.logger.info(`[ComposeDB] ${this.did} getPassport`);
      const passportWithWrapper = await this.getPassportWithWrapper();
      const stamps = passportWithWrapper.map((wrapper) => ({
        provider: wrapper.vc.credentialSubject.provider as PROVIDER_ID,
        credential: formatCredentialFromCeramic(wrapper.vc),
      }));

      console.log(`[ComposeDB] ${this.did} getPassport stamps:`, stamps);
      this.logger.info(`[ComposeDB] ${this.did} getPassport stamps`, { stamps });
      return {
        status: "Success",
        passport: {
          stamps,
        },
      };
    } catch (error) {
      console.error(`[ComposeDB] ${this.did} getPassport error:`, error);
      this.logger.error(`[ComposeDB] ${this.did} getPassport error`, { error });
      return {
        status: "ExceptionRaised",
        errorDetails: {
          messages: [error.message],
        },
      };
    }
  }
}
