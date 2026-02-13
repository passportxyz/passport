import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { NFTHolderProvider } from "../Providers/nftHolder.js";

jest.mock("axios");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

const makePayload = (overrides: Partial<{ address: string; conditionName: string; conditionHash: string }> = {}) =>
  ({
    address: overrides.address ?? MOCK_ADDRESS,
    proofs: {
      conditionName: overrides.conditionName ?? "test-nft",
      conditionHash: overrides.conditionHash ?? "0xabc123",
    },
  }) as unknown as RequestPayload;

const singleContract = {
  contracts: [{ address: "0x1234567890abcdef1234567890abcdef12345678", chainId: 1 }],
};

function mockConditionResponse(condition: { contracts: Array<{ address: string; chainId: number }> }) {
  (axios.get as jest.Mock).mockResolvedValueOnce({
    data: {
      ruleset: { condition },
    },
  });
}

function mockRpcBalance(balance: number) {
  (axios.post as jest.Mock).mockResolvedValueOnce({
    data: { jsonrpc: "2.0", id: 1, result: "0x" + balance.toString(16) },
  });
}

function mockRpcError(message: string) {
  (axios.post as jest.Mock).mockResolvedValueOnce({
    data: { jsonrpc: "2.0", id: 1, error: { message } },
  });
}

describe("NFTHolderProvider verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ALCHEMY_API_KEY = "test-alchemy-key";
    process.env.SCORER_ENDPOINT = "https://scorer.example.com";
    process.env.SCORER_API_KEY = "test-api-key";
  });

  // 1. Successful verification - address holds matching NFT (balance > 0)
  it("returns valid when address holds a matching NFT", async () => {
    mockConditionResponse(singleContract);
    mockRpcBalance(3);

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS,
        conditionName: "test-nft",
        conditionHash: "0xabc123",
      },
    });

    // Verify condition endpoint was called correctly
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/internal/customization/credential/"),
      expect.objectContaining({
        headers: { Authorization: "test-api-key" },
      })
    );

    // Verify RPC call was made with timeout
    expect(axios.post).toHaveBeenCalledWith(
      "https://eth-mainnet.g.alchemy.com/v2/test-alchemy-key",
      expect.objectContaining({
        jsonrpc: "2.0",
        method: "eth_call",
      }),
      { timeout: 10_000 }
    );
  });

  // 2. Failed verification - no matching NFT holdings (balance = 0)
  it("returns invalid when address has zero balance for all contracts", async () => {
    mockConditionResponse(singleContract);
    mockRpcBalance(0);

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["No matching NFT holdings found"]);
    expect(result.record).toBeUndefined();
  });

  // 3. Missing conditionName/conditionHash - returns invalid with descriptive error
  it("returns invalid when conditionName is missing", async () => {
    const provider = new NFTHolderProvider();
    const payload = {
      address: MOCK_ADDRESS,
      proofs: { conditionHash: "0xabc123" },
    } as unknown as RequestPayload;

    const result = await provider.verify(payload);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Missing conditionName or conditionHash in payload"]);
  });

  it("returns invalid when conditionHash is missing", async () => {
    const provider = new NFTHolderProvider();
    const payload = {
      address: MOCK_ADDRESS,
      proofs: { conditionName: "test-nft" },
    } as unknown as RequestPayload;

    const result = await provider.verify(payload);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Missing conditionName or conditionHash in payload"]);
  });

  // 4. Invalid wallet address - non-hex, too short, missing 0x prefix
  it("returns invalid for a non-hex wallet address", async () => {
    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload({ address: "0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Invalid wallet address"]);
  });

  it("returns invalid for a too-short wallet address", async () => {
    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload({ address: "0x1234" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Invalid wallet address"]);
  });

  it("returns invalid for an address missing 0x prefix", async () => {
    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload({ address: "cF314CE817E25b4F784bC1f24c9A79A525fEC50f" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Invalid wallet address"]);
  });

  it("returns invalid when address is empty", async () => {
    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload({ address: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Invalid wallet address"]);
  });

  // 5. Multiple contracts - OR logic - one match is sufficient even if others fail
  it("returns valid when at least one contract has a matching NFT (OR logic)", async () => {
    const multiContractCondition = {
      contracts: [
        { address: "0x1111111111111111111111111111111111111111", chainId: 1 },
        { address: "0x2222222222222222222222222222222222222222", chainId: 10 },
        { address: "0x3333333333333333333333333333333333333333", chainId: 137 },
      ],
    };
    mockConditionResponse(multiContractCondition);

    // First contract: balance 0 (no match)
    mockRpcBalance(0);
    // Second contract: RPC call rejects entirely
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error("RPC timeout"));
    // Third contract: balance 1 (match)
    mockRpcBalance(1);

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(true);
    expect(result.record).toEqual({
      address: MOCK_ADDRESS,
      conditionName: "test-nft",
      conditionHash: "0xabc123",
    });
  });

  it("includes failed check count in error when some RPC calls reject", async () => {
    const multiContractCondition = {
      contracts: [
        { address: "0x1111111111111111111111111111111111111111", chainId: 1 },
        { address: "0x2222222222222222222222222222222222222222", chainId: 10 },
      ],
    };
    mockConditionResponse(multiContractCondition);

    // First contract: balance 0
    mockRpcBalance(0);
    // Second contract: RPC rejects
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["No matching NFT holdings found (1/2 checks failed)"]);
  });

  // 6. MAX_CONTRACTS limit exceeded - condition with >20 contracts rejected
  it("returns invalid when condition has more than 20 contracts", async () => {
    const tooManyContracts = {
      contracts: Array.from({ length: 21 }, (_, i) => ({
        address: `0x${(i + 1).toString(16).padStart(40, "0")}`,
        chainId: 1,
      })),
    };
    mockConditionResponse(tooManyContracts);

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Too many contracts: 21 exceeds limit of 20"]);
  });

  // 7. RPC error - response.data.error from RPC node
  it("treats RPC error response as a rejected check", async () => {
    mockConditionResponse(singleContract);
    mockRpcError("execution reverted");

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(false);
    // Single contract that threw, so 1/1 checks failed
    expect(result.errors).toEqual(["No matching NFT holdings found (1/1 checks failed)"]);
  });

  // 8. getRpcUrl for unsupported chainId - throws error for unknown chain
  it("rejects when contract uses an unsupported chainId", async () => {
    const unsupportedChain = {
      contracts: [{ address: "0x1234567890abcdef1234567890abcdef12345678", chainId: 99999 }],
    };
    mockConditionResponse(unsupportedChain);

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    // getRpcUrl throws, which causes the Promise.allSettled entry to be rejected
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["No matching NFT holdings found (1/1 checks failed)"]);
  });

  // 9. getCondition API error - axios.get fails for condition endpoint
  it("throws when the condition API request fails", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const provider = new NFTHolderProvider();
    await expect(provider.verify(makePayload())).rejects.toThrow();
  });

  // 10. Empty contracts array - condition with no contracts
  it("returns invalid when condition has an empty contracts array", async () => {
    mockConditionResponse({ contracts: [] });

    const provider = new NFTHolderProvider();
    const result = await provider.verify(makePayload());

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["Invalid condition: no contracts defined"]);
  });

  // 11. RPC timeout handling - verify timeout is passed to axios.post
  it("passes the configured timeout to RPC calls", async () => {
    mockConditionResponse(singleContract);
    mockRpcBalance(1);

    const provider = new NFTHolderProvider();
    await provider.verify(makePayload());

    expect(axios.post).toHaveBeenCalledWith(
      "https://eth-mainnet.g.alchemy.com/v2/test-alchemy-key",
      expect.any(Object),
      { timeout: 10_000 }
    );
  });
});
