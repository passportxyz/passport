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

  constructor(
    ceramicDatabase: DataStorageBase,
    ceramicCacheUrl: string,
    ceramicCacheApiKey: string,
    address: string,
    logger?: Logger,
    did?: CeramicDID
  ) {
    this.ceramicCacheUrl = ceramicCacheUrl;
    this.ceramicCacheApiKey = ceramicCacheApiKey;
    this.address = address;
    this.logger = logger;
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();
  }

  async createPassport(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async getPassport(): Promise<PassportLoadResponse> {
    let passport: Passport;
    let status: PassportLoadStatus = "Success";
    let errorDetails: PassportLoadErrorDetails;

    try {
      const response = await axios.get(`${this.ceramicCacheUrl}/ceramic-cache/stamp?address=${this.address}`);
      const { data } = response;
      if (data && data.success && data.stamps.length !== 0) {
        passport = {
          issuanceDate: null,
          expiryDate: null,
          stamps: data.stamps,
        };
      } else {
        status = "NoStampsInCache";
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
  async addStamp(stamp: Stamp): Promise<void> {
    this.logger.info(`adding stamp to ceramicCache address: ${this.address}`);
    try {
      // Todo will need to validate ownership / pass signature
      await axios.post(`${this.ceramicCacheUrl}/ceramic-cache/stamp`, {
        address: this.address,
        provider: stamp.provider,
        stamp: stamp.credential,
      });
    } catch (e) {
      this.logger.error(`Error saving stamp to ceramicCache address:  ${this.address}:` + e.toString());
    }
  }
  async deleteStamp(provider: PROVIDER_ID): Promise<void> {
    this.logger.info(`deleting stamp from ceramicCache for ${provider} on ${this.address}`);
    try {
      await axios.delete(`${this.ceramicCacheUrl}/ceramic-cache/stamp`, {
        data: {
          address: this.address,
          provider: provider,
        },
      });
    } catch (e) {
      this.logger.error(`Error deleting stamp from ceramicCache for ${provider} on ${this.address}: ` + e.toString());
    }
  }
}
