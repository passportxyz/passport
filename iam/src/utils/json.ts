import { ReplaceBigIntWithString } from "@gitcoin/passport-types";

export const toJsonObject = <T>(obj: T): ReplaceBigIntWithString<T> => {
  return JSON.parse(JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value)));
};

export const serializeJson = (obj: object): string => {
  return JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value));
};
