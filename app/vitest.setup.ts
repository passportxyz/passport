import "@testing-library/jest-dom";

const { info, log, warn, error } = console;
const ignored = ["Lit is in dev mode"];

const filterIgnored = (callback: any, ...args: any[]) => {
  const msg = args?.[0];
  if (typeof msg !== "string" || !ignored.some((ignoredMsg) => msg.includes(ignoredMsg))) {
    callback(...args);
  }
};

console.info = (...args) => filterIgnored(info, ...args);
console.log = (...args) => filterIgnored(log, ...args);
console.warn = (...args) => filterIgnored(warn, ...args);
console.error = (...args) => filterIgnored(error, ...args);

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.log(`FAILED TO HANDLE PROMISE REJECTION`);
  throw reason;
});
