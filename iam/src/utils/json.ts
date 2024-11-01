// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toJsonObject = (obj: any): any => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.parse(JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value)));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serializeJson = (obj: object): string => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.stringify(obj, (_key, value) => (typeof value === "bigint" ? value.toString() : value));
};
