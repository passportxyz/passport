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
} from "@gitcoin/passport-types";

export class PassportDatabase implements DataStorageBase {
  passportScorerUrl: string;
  address: string;
  token: string;
  did: string;
  logger: Logger;
  allowEmpty: boolean;
  

  constructor(
    passportScorerUrl: string,
    address: string,
    token: string,
    logger?: Logger,
    did?: CeramicDID,
  ) {
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

  async getPassport(): Promise<PassportLoadResponse> {
    let passport: Passport;
    let status: PassportLoadStatus = "Success";
    let errorDetails: PassportLoadErrorDetails;

    try {
      const response = await axios.get(`${this.passportScorerUrl}ceramic-cache/stamp?address=${this.address}`);
      this.logger.info(`[Scorer] Loaded passport for did ${this.did} => ${this.address}`);

      const { data } = response;
      if (data && data.success && (this.allowEmpty || data.stamps.length !== 0)) {
        passport = {
          issuanceDate: null,
          expiryDate: null,
          stamps: data.stamps.map((stamp: any) => ({ ...stamp, credential: stamp.stamp })),
        };
      } else {
        status = "DoesNotExist";
      }
    } catch (e) {
      status = "ExceptionRaised";
      this.logger.error(`[Scorer] Error when loading passport for did  ${this.address}:` + e.toString(), { error: e });
    } finally {
      return {
        passport,
        status,
        errorDetails,
      };
    }
  }

  addStamps = async (stamps: Stamp[]): Promise<void> => {
    this.logger.info(`adding stamp to passportScorer address: ${this.address}`);
    try {
      const stampsToSave = stamps.map((stamp) => ({
        provider: stamp.provider,
        stamp: stamp.credential,
      }));

      await axios.post(`${this.passportScorerUrl}ceramic-cache/stamps/bulk`, stampsToSave, {
          headers:
            { Authorization: `Bearer ${this.token}`},
        });
    } catch (e) {
      this.logger.error(`Error saving stamp to passportScorer address:  ${this.address}:` + e.toString());
    }
  };

  addStamp = async (stamp: Stamp): Promise<void> => {
    console.log("Not implemented");
  };

  async deleteStamps(providers: PROVIDER_ID[]): Promise<void> {
    this.logger.info(`deleting stamp from passportScorer for ${providers.join(", ")} on ${this.address}`);
    try {
      await axios.delete(`${this.passportScorerUrl}ceramic-cache/stamps/bulk`, {
        data: providers.map((provider) => ({ provider })),
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch (e) {
      this.logger.error(`Error deleting stamp from passportScorer for ${providers.join(", ")} on ${this.address}: ` + e.toString());
    }
  }
}
