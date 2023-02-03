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

export class CeramicCacheDatabase implements DataStorageBase {
  ceramicCacheUrl: string;
  ceramicCacheApiKey: string;
  address: string;
  did: string;
  logger: Logger;
  allowEmpty: boolean;
  token: string;

  constructor(ceramicCacheUrl: string, address: string, token: string, logger?: Logger, did?: CeramicDID) {
    this.ceramicCacheUrl = ceramicCacheUrl;
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
      const response = await axios.get(`${this.ceramicCacheUrl}ceramic-cache/stamp?address=${this.address}`);
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
      this.logger.error(`Error when loading passport for did  ${this.address}:` + e.toString(), { error: e });
    } finally {
      return {
        passport,
        status,
        errorDetails,
      };
    }
  }

  addStamps = async (stamps: Stamp[]): Promise<void> => {
    await Promise.all(stamps.map((stamp) => this.addStamp(stamp)));
  };

  async addStamp(stamp: Stamp): Promise<void> {
    this.logger.info(`adding stamp to ceramicCache address: ${this.address}`);
    try {
      // Todo will need to validate ownership / pass signature
      await axios.post(`${this.ceramicCacheUrl}ceramic-cache/stamp`,
        {
          address: this.address,
          provider: stamp.provider,
          stamp: stamp.credential,
        },
        {
          headers:
            { Authorization: `Bearer ${this.token}`},
        });
    } catch (e) {
      this.logger.error(`Error saving stamp to ceramicCache address:  ${this.address}:` + e.toString());
    }
  }

  async deleteStamp(provider: PROVIDER_ID): Promise<void> {
    this.logger.info(`deleting stamp from ceramicCache for ${provider} on ${this.address}`);
    try {
      await axios.delete(`${this.ceramicCacheUrl}ceramic-cache/stamp`, {
        data: {
          address: this.address,
          provider: provider,
        },
        headers: { Authorization: `Bearer ${this.token}` },
      });
    } catch (e) {
      this.logger.error(`Error deleting stamp from ceramicCache for ${provider} on ${this.address}: ` + e.toString());
    }
  }
}
