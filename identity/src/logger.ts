let logger = console;

export function setLogger(newLogger: any) {
  logger = newLogger;
}

export function error(...args: any[]) {
  logger.error(...args);
}
export function info(...args: any[]) {
  logger.info(...args);
}

export function warn(...args: any[]) {
  logger.warn(...args);
}

export function debug(...args: any[]) {
  logger.debug(...args);
}

info("Identity module. Logger initialized");
