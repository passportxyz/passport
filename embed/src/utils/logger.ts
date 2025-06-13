import pinoImport from "pino";
const pino = pinoImport.default;
// https://github.com/pinojs/pino
import type { LogFn } from "pino";

const isError = (value: unknown): value is Error =>
  value instanceof Error ||
  (typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).name === "string" &&
    typeof (value as Record<string, unknown>).message === "string");

const serializeError = (error: Error): string => {
  const obj: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  // Include any additional enumerable properties
  for (const key in error) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      obj[key] = (error as unknown as Record<string, unknown>)[key];
    }
  }

  return JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value));
};

const convertArgsToString = (args: unknown[]): string =>
  args
    .map((arg) => {
      if (isError(arg)) {
        return serializeError(arg);
      }
      return typeof arg === "object"
        ? JSON.stringify(arg, (_, value) => (typeof value === "bigint" ? value.toString() : value))
        : String(arg);
    })
    .join(" ");

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.prototype.toString.call(value) === "[object Object]";

// Returns [obj, msg] or [msg] for pino compatibility
export function formatLogArgs(
  args: unknown[]
): [string] | [Record<string, unknown>] | [Record<string, unknown>, string] {
  if (args.length === 0) return [""];
  if (isPlainObject(args[0])) {
    const [firstArg, ...restArgs] = args;
    return [firstArg, convertArgsToString(restArgs)];
  }
  return [convertArgsToString(args)];
}

export function mergeTrailingArgs(this: unknown, args: unknown[], method: LogFn, _level: number): void {
  const formatted = formatLogArgs(args);
  // @ts-expect-error @typescript-eslint/no-explicit-any
  method.apply(this, formatted);
}

export const logger = pino({
  hooks: {
    logMethod: mergeTrailingArgs,
  },
});

logger.info("Logger initialized");
