import { AuthType } from "./../types";
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Platform } from "../types";
export class ZkSyncPlatform implements Platform {
  path: string;
  platformId = "ZkSync";
  authType = AuthType.Null;
}
