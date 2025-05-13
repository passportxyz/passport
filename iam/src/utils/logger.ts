import pinoImport from "pino";
const pino = pinoImport.default;
// https://github.com/pinojs/pino

const convertArgsToString = (args: unknown[]): string => args.map((arg) => arg.toString()).join(" ");

const buildLogArgs = (args: unknown[]): unknown[] => {
  if (args.length <= 1) {
    return args;
  }

  const [firstArg, ...restArgs] = args;
  return typeof firstArg === "object" ? [firstArg, convertArgsToString(restArgs)] : [convertArgsToString(args)];
};

// By default, newer versions of pino will not merge trailing arguments, instead
// expecting those to be used for interpolation. But there is no error for unused
// trailing arguments. The following makes it similar to console.log behavior,
// although if the first arg is an object, it will be passed to pino to be merged
// with the log object (like normal pino behavior).
// For example:
// logger.info({foo: "bar"}, "hello", "world")
// will log:
// {"foo":"bar","level":30,"msg":"hello world","time":"2021-01-01T00:00:00.000Z"}
// and
// logger.info("hello", "world")
// will log:
// {"level":30,"msg":"hello world","time":"2021-01-01T00:00:00.000Z"}
function mergeTrailingArgs(args: unknown[], method: (...args: unknown[]) => void): void {
  const logArgs = buildLogArgs(args);
  method.apply(this, logArgs);
}

export const logger = pino({
  hooks: {
    logMethod: mergeTrailingArgs,
  },
});

logger.info("Logger initialized");
