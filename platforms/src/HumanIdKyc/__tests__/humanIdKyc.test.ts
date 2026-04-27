// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { HumanIdKycProvider } from "../Providers/humanIdKyc.js";
import { getKycSBTByAddress, getZkPassportSBTByAddress, setOptimismRpcUrl } from "@holonym-foundation/human-id-sdk";

// Mock the SDK
jest.mock("@holonym-foundation/human-id-sdk", () => ({
  getKycSBTByAddress: jest.fn(),
  getZkPassportSBTByAddress: jest.fn(),
  setOptimismRpcUrl: jest.fn(),
}));

// Mock axios for the off-chain attestation HTTP call
jest.mock("axios");

const mockedGetKycSBT = getKycSBTByAddress as jest.MockedFunction<typeof getKycSBTByAddress>;
const mockedGetZkpSBT = getZkPassportSBTByAddress as jest.MockedFunction<typeof getZkPassportSBTByAddress>;
const mockedSetRpcUrl = setOptimismRpcUrl as jest.MockedFunction<typeof setOptimismRpcUrl>;
const mockedAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";

const validSbt = (nullifier: string) =>
  Promise.resolve({
    expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
    publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(nullifier), BigInt(5)],
    revoked: false,
  } as any);

const offChainResponse = (expiresAt: Date, uniqueIdentifier = "uid-abc") => ({
  status: 200,
  data: {
    address: MOCK_ADDRESS.toLowerCase(),
    attestationType: "zk-passport",
    payload: { uniqueIdentifier },
    issuedAt: new Date(expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: expiresAt.toISOString(),
  },
});

const offChainNotFound = () => Promise.resolve({ status: 404, data: { code: "NOT_FOUND" } });

describe("HumanIdKycProvider (Government ID, multi-source)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.resetAllMocks();
    originalEnv = process.env;
    process.env = { ...originalEnv, OPTIMISM_RPC_URL: "https://test-rpc.optimism.io" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns valid when only the regular KYC SBT exists", async () => {
    mockedGetKycSBT.mockReturnValueOnce(validSbt("11111"));
    mockedGetZkpSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedAxiosGet.mockResolvedValueOnce(offChainNotFound());

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(mockedSetRpcUrl).toHaveBeenCalledWith("https://test-rpc.optimism.io");
    expect(result.valid).toBe(true);
    expect(result.record).toEqual({ nullifier: "11111" });
    expect(result.expiresInSeconds).toBeUndefined();
    // Short-circuits — does not call later sources
    expect(mockedGetZkpSBT).not.toHaveBeenCalled();
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("returns valid when only the paid ZK Passport SBT exists", async () => {
    mockedGetKycSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedGetZkpSBT.mockReturnValueOnce(validSbt("22222"));

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(true);
    expect(result.record).toEqual({ nullifier: "22222", sbtType: "zk-passport-onchain" });
    expect(result.expiresInSeconds).toBeUndefined();
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("returns valid with off-chain attestation only, with expiresInSeconds clamped to attestation TTL", async () => {
    mockedGetKycSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedGetZkpSBT.mockRejectedValueOnce(new Error("SBT not found"));
    // 1 day from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockedAxiosGet.mockResolvedValueOnce(offChainResponse(expiresAt, "uid-1day"));

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(true);
    expect(result.record).toEqual({ nullifier: "uid-1day", sbtType: "zk-passport-offchain" });
    // Allow a small fudge (test execution time)
    expect(result.expiresInSeconds).toBeGreaterThanOrEqual(86_390);
    expect(result.expiresInSeconds).toBeLessThanOrEqual(86_400);
  });

  it("off-chain attestation valid 6 days in returns ~1 day expiry", async () => {
    mockedGetKycSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedGetZkpSBT.mockRejectedValueOnce(new Error("SBT not found"));
    // issued 6 days ago, expires in 1 day
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockedAxiosGet.mockResolvedValueOnce(offChainResponse(expiresAt));

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(true);
    expect(result.expiresInSeconds).toBeGreaterThanOrEqual(86_390);
    expect(result.expiresInSeconds).toBeLessThanOrEqual(86_400);
  });

  it("prefers SBT-based sources when multiple credentials exist (no expiry override)", async () => {
    mockedGetKycSBT.mockReturnValueOnce(validSbt("33333"));
    // ZK Passport SBT and off-chain attestation also exist, but should not be reached
    mockedGetZkpSBT.mockReturnValueOnce(validSbt("44444"));
    mockedAxiosGet.mockResolvedValueOnce(offChainResponse(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(true);
    expect(result.record).toEqual({ nullifier: "33333" });
    expect(result.expiresInSeconds).toBeUndefined();
    expect(mockedGetZkpSBT).not.toHaveBeenCalled();
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("returns invalid when no source has a valid credential", async () => {
    mockedGetKycSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedGetZkpSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedAxiosGet.mockResolvedValueOnce(offChainNotFound());

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(false);
    expect(result.errors?.[0]).toMatch(/^kyc /);
  });

  it("treats an expired off-chain attestation as invalid", async () => {
    mockedGetKycSBT.mockRejectedValueOnce(new Error("SBT not found"));
    mockedGetZkpSBT.mockRejectedValueOnce(new Error("SBT not found"));
    // Already expired
    mockedAxiosGet.mockResolvedValueOnce(offChainResponse(new Date(Date.now() - 60_000)));

    const result = await new HumanIdKycProvider().verify({ address: MOCK_ADDRESS } as RequestPayload);

    expect(result.valid).toBe(false);
  });

  it("rejects malformed addresses without calling any source", async () => {
    const result = new HumanIdKycProvider().verify({ address: "not-an-address" } as RequestPayload);
    await expect(result).rejects.toThrow("Invalid address format");
    expect(mockedGetKycSBT).not.toHaveBeenCalled();
    expect(mockedGetZkpSBT).not.toHaveBeenCalled();
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });
});
