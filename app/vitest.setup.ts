import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock WaaP (Human Wallet) initialisation so tests never load its iframe. The
// stub has no stored login, so the wagmi connector reports "not authorized".
vi.mock("@human.tech/waap-sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@human.tech/waap-sdk")>()),
  initWaaP: vi.fn(() => ({
    connected: false,
    on: vi.fn(),
    removeListener: vi.fn(),
    request: vi.fn(async () => []),
    login: vi.fn(),
    logout: vi.fn(),
    getLoginMethod: vi.fn(() => null),
    requestEmail: vi.fn(),
  })),
}));

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
