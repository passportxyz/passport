import { PassportLoadResponse, Stamp } from "@gitcoin/passport-types";
import axios from "axios";
import { Logger } from "./ceramicClient";
import { DataStorageBase } from "./types";

export class CeramicCacheDatabase implements DataStorageBase {
  ceramicCacheUrl: string;
  address: string;
  logger: Logger;

  constructor(ceramicCacheUrl: string, address: string, logger?: Logger) {
    this.ceramicCacheUrl = ceramicCacheUrl;
    this.address = address;
    this.logger = logger;
  }

  async createPassport(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async getPassport(): Promise<PassportLoadResponse> {
    throw new Error("Method not implemented.");
  }
  async addStamp(stamp: Stamp): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
