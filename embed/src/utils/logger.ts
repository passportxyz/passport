import pinoImport from "pino";
const pino = pinoImport.default;
// https://github.com/pinojs/pino

export const logger = pino();

logger.info("Logger initialized");
