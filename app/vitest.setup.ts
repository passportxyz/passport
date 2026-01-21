import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Silk wallet SDK to prevent async initialization in tests
vi.mock("@silk-wallet/silk-wallet-sdk", () => ({
  initSilk: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    request: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock @reown/appkit to prevent network requests during tests
vi.mock("@reown/appkit/react", () => ({
  useAppKit: () => ({ open: vi.fn() }),
  useAppKitEvents: () => ({
    data: { event: "MODAL_CLOSE", properties: { connected: true } },
  }),
  useAppKitState: () => ({ open: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useAppKitAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    isConnected: true,
  }),
  createAppKit: vi.fn(() => ({ open: vi.fn() })),
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
