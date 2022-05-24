import winston, { createLogger, format, transports } from "winston";

export const LOG_FORMAT = format.printf(({ level, message, label, timestamp }) => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const createFormattedConsoleLogger = (componentName: string): winston.Logger => {
  return createLogger({
    format: format.combine(
      format.errors({ stack: true }),
      format.label({ label: componentName }),
      format.timestamp(),
      LOG_FORMAT
    ),
    transports: [new transports.Console()],
  });
};
