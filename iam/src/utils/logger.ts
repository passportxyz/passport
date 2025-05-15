import pinoImport from "pino";
const pino = pinoImport.default;
// https://github.com/pinojs/pino
import type { LogFn } from "pino";

const convertArgsToString = (args: unknown[]): string =>
  args
    .map((arg) =>
      typeof arg === "object"
        ? JSON.stringify(arg, (_, value) => (typeof value === "bigint" ? value.toString() : value))
        : String(arg)
    )
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
  method.apply(this, formatted);
}

export const logger = pino({
  hooks: {
    logMethod: mergeTrailingArgs,
  },
});

logger.info("Logger initialized");
