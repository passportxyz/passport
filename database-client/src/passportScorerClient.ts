import axios from "axios";
import { Logger } from "./ceramicClient";
import { DataStorageBase } from "./types";
import type { DID as CeramicDID } from "dids";
import {
  PROVIDER_ID,
  Stamp,
  PassportLoadStatus,
  PassportLoadResponse,
  PassportLoadErrorDetails,
  Passport,
  StampPatch,
} from "@gitcoin/passport-types";

export class PassportDatabase implements DataStorageBase {
  passportScorerUrl: string;
  address: string;
  token: string;
  did: string;
  logger: Logger;
  allowEmpty: boolean;

  constructor(passportScorerUrl: string, address: string, token: string, logger?: Logger, did?: CeramicDID) {
    this.passportScorerUrl = passportScorerUrl;
    this.address = address;
    this.logger = logger;
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();
    this.allowEmpty = false;
    this.token = token;
  }

  async createPassport(initialStamps?: Stamp[]): Promise<string> {
    if (initialStamps?.length) {
      await this.addStamps(initialStamps);
    } else {
      this.allowEmpty = true;
    }

    return "created";
  }

  processPassportResponse = async (request: Promise<any>, requestType: string): Promise<PassportLoadResponse> => {
    let passport: Passport;
    let status: PassportLoadStatus = "Success";
    let errorDetails: PassportLoadErrorDetails;

    try {
      const response = await request;
      this.logger.info(`[Scorer] made ${requestType} request for passport for did ${this.did} => ${this.address}`);

      const { data } = response;
      if (data && data.success && (this.allowEmpty || data.stamps.length !== 0)) {
        passport = {
          issuanceDate: null,
          expiryDate: null,
          stamps: data.stamps.map((stamp: any) => ({
            provider: stamp.stamp?.credentialSubject?.provider,
            credential: stamp.stamp,
          })),
        };
      } else {
        status = "DoesNotExist";
      }
    } catch (e) {
      status = "ExceptionRaised";
      this.logger.error(
        `[Scorer] Error thrown when making ${requestType} for passport with did ${this.address}: ` + e.toString(),
        { error: e }
      );
    } finally {
      return {
        passport,
        status,
        errorDetails,
      };
    }
  };

  async getPassport(): Promise<PassportLoadResponse> {
    return await this.processPassportResponse(
      axios.get(`${this.passportScorerUrl}/stamp?address=${this.address}`),
      "get"
    );
  }

  addStamps = async (stamps: Stamp[]): Promise<PassportLoadResponse> => {
    this.logger.info(`adding stamp to passportScorer address: ${this.address}`);
    const stampsToSave = stamps.map((stamp) => ({
      provider: stamp.provider,
      stamp: stamp.credential,
    }));

    return await this.processPassportResponse(
      axios.post(`${this.passportScorerUrl}/stamps/bulk`, stampsToSave, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
      "post"
    );
  };

  addStamp = async (stamp: Stamp): Promise<void> => {
    console.log("Not implemented");
  };

  deleteStamps = async (providers: PROVIDER_ID[]): Promise<PassportLoadResponse> => {
    this.logger.info(`deleting stamp from passportScorer for ${providers.join(", ")} on ${this.address}`);
    return await this.processPassportResponse(
      axios.delete(`${this.passportScorerUrl}/stamps/bulk`, {
        data: providers.map((provider) => ({ provider })),
        headers: { Authorization: `Bearer ${this.token}` },
      }),
      "delete"
    );
  };

  patchStamps = async (stampPatches: StampPatch[]): Promise<PassportLoadResponse> => {
    this.logger.info(`patching stamps in passportScorer for address: ${this.address}`);
    const body = stampPatches.map(({ provider, credential }) => ({ provider, stamp: credential }));
    return await this.processPassportResponse(
      axios.patch(`${this.passportScorerUrl}/stamps/bulk`, body, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
      "patch"
    );
  };
}
