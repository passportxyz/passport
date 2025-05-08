import { createChainSweeper, processChainSweeper, SweeperError, ChainSweeper } from "./ChainSweeper";
import type { WalletClient, PublicClient, Transport, Chain } from "viem";

describe("ChainSweeper", () => {
  const validConfig = {
    alchemyApiKey: "test-key",
    privateKey: "0x1111111111111111111111111111111111111111111111111111111111111111",
    thresholdWei: 1000000000000000000n, // 1 ETH
    alchemyChainName: "eth-mainnet",
    feeDestination: "0x2222222222222222222222222222222222222222",
  };

  it("throws on invalid feeDestination", async () => {
    await expect(createChainSweeper({ ...validConfig, feeDestination: "invalid" })).rejects.toThrow(SweeperError);
  });

  it("creates a ChainSweeper instance with valid config", async () => {
    // Mock getClients to avoid network
    const getClientsSpy = jest.spyOn(require("./ChainSweeper"), "getClients").mockResolvedValue({
      publicClient: {
        getBalance: jest.fn().mockResolvedValue(2n * validConfig.thresholdWei),
      } as unknown as PublicClient<Transport, Chain>,
      walletClient: {
        account: { address: validConfig.privateKey as `0x${string}` },
        sendTransaction: jest.fn().mockResolvedValue("0xhash"),
      } as unknown as WalletClient<Transport, Chain>,
      account: { address: validConfig.privateKey as `0x${string}` },
    });
    const sweeper = await createChainSweeper(validConfig);
    expect(sweeper).toMatchObject({
      publicClient: expect.any(Object),
      walletClient: expect.any(Object),
      thresholdWei: validConfig.thresholdWei,
      accountAddress: expect.any(String),
      feeDestination: validConfig.feeDestination,
    });
    getClientsSpy.mockRestore();
  });

  it("should sweep if balance is above threshold", async () => {
    const publicClient = {
      getBalance: jest.fn().mockResolvedValue(2n * validConfig.thresholdWei),
    } as unknown as PublicClient<Transport, Chain>;
    const sendTransaction = jest.fn().mockResolvedValue("0xhash");
    const walletClient = {
      account: { address: validConfig.privateKey as `0x${string}` },
      sendTransaction,
    } as unknown as WalletClient<Transport, Chain>;
    const sweeper: ChainSweeper = {
      publicClient,
      walletClient,
      thresholdWei: validConfig.thresholdWei,
      accountAddress: validConfig.privateKey as `0x${string}`,
      feeDestination: validConfig.feeDestination as `0x${string}`,
    };
    await processChainSweeper(sweeper);
    expect(sendTransaction).toHaveBeenCalled();
  });

  it("should not sweep if balance is below threshold", async () => {
    const publicClient = { getBalance: jest.fn().mockResolvedValue(0n) } as unknown as PublicClient<Transport, Chain>;
    const sendTransaction = jest.fn();
    const walletClient = {
      account: { address: validConfig.privateKey as `0x${string}` },
      sendTransaction,
    } as unknown as WalletClient<Transport, Chain>;
    const sweeper: ChainSweeper = {
      publicClient,
      walletClient,
      thresholdWei: validConfig.thresholdWei,
      accountAddress: validConfig.privateKey as `0x${string}`,
      feeDestination: validConfig.feeDestination as `0x${string}`,
    };
    await processChainSweeper(sweeper);
    expect(sendTransaction).not.toHaveBeenCalled();
  });
});
