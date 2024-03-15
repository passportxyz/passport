import { ProviderContext } from "@gitcoin/passport-types";

export type UberUserData = {
  rides?: number;
  createdAt?: string;
  id?: string;
};

export const initClientAndGetAuthUrl = async (callbackOverride?: string): Promise<string> => {
  if (process.env.RECLAIM_APP_ID && process.env.RECLAIM_APP_SECRET) {
    return; //url;
  } else {
    throw "Missing RECLAIM_APP_ID or RECLAIM_APP_SECRET";
  }
};

export const getUberUserData = async (context: ProviderContext, sessionKey: string): Promise<UberUserData> => {
  return {};
};
