export const toJsonObject = (obj: any): object => {
  return JSON.parse(JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value)));
};

export const serializeJson = (obj: any): string => {
  return JSON.stringify(obj, (key, value) => (typeof value === "bigint" ? value.toString() : value));
};
