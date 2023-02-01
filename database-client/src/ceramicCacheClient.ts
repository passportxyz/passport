import { PassportLoadResponse, Stamp } from "@gitcoin/passport-types";
import axios from "axios";
import { DataStorageBase } from "./types";

export class CeramicCacheClient implements DataStorageBase {
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
