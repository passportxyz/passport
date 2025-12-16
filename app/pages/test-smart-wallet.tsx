import { useState, useEffect } from "react";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { hashMessage, recoverMessageAddress } from "viem";
import { base } from "viem/chains";
import { SiweMessage } from "siwe";
import { web3Modal } from "../utils/web3";

export default function TestSmartWallet() {
  const { address, isConnected, chain, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const [logs, setLogs] = useState<string[]>([]);
  const [signature, setSignature] = useState<string>("");
  const [preparedMessage, setPreparedMessage] = useState<string>("");

  const log = (msg: string) => {
    console.log(msg);
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]} ${msg}`]);
  };

  const clearLogs = () => setLogs([]);

  // Force re-render when connection changes
  useEffect(() => {
    if (isConnected && address) {
      log(`Connected: ${address} on ${chain?.name || "unknown chain"}`);
    }
  }, [isConnected, address, chain]);

  const connectWallet = async () => {
    clearLogs();
    log("Opening wallet modal...");
    try {
      await web3Modal.open();
      log("Modal opened - select Coinbase Wallet");
    } catch (e: any) {
      log(`ERROR: ${e.message}`);
    }
  };

  const signPlainMessage = async () => {
    if (!walletClient || !address) {
      log("ERROR: No wallet client available");
      return;
    }

    clearLogs();
    log(`--- SIWE MESSAGE SIGNING TEST (same as main app) ---`);

    // Use the actual connected chain (critical for smart wallet)
    const connectedChainId = chainId ?? 1;
    log(`Chain ID: ${connectedChainId}`);

    // Create SIWE message exactly like main app
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to Human Passport",
      uri: window.location.origin,
      version: "1",
      chainId: connectedChainId,
      nonce: Math.random().toString(36).substring(2, 15), // Random nonce for testing
    });

    const message = siweMessage.prepareMessage();
    setPreparedMessage(message);

    log(`SIWE Message:\n${message}`);

    try {
      // Step 1: Sign using walletClient (EXACTLY same as main app)
      log("\n[1] Requesting signature from wallet...");
      const sig = await walletClient.signMessage({
        account: address as `0x${string}`,
        message,
      });
      setSignature(sig);
      log(`Signature received!`);
      log(`Signature length: ${(sig.length - 2) / 2} bytes`);
      log(`Signature (truncated): ${sig.slice(0, 66)}...${sig.slice(-20)}`);

      // Check if ERC-6492
      const ERC6492_MAGIC = "6492649264926492649264926492649264926492649264926492649264926492";
      const isERC6492 = sig.toLowerCase().endsWith(ERC6492_MAGIC);
      log(`Is ERC-6492 wrapped: ${isERC6492}`);

      // Step 2: Hash the message (EIP-191)
      log("\n[2] Computing message hash (EIP-191)...");
      const hash = hashMessage(message);
      log(`EIP-191 hash: ${hash}`);

      // Step 3: Try to recover signer (will fail for smart wallets)
      log("\n[3] Attempting ecrecover (will fail for smart wallets)...");
      try {
        const recovered = await recoverMessageAddress({
          message: message,
          signature: sig as `0x${string}`,
        });
        log(`Recovered address: ${recovered}`);
        log(`Expected address: ${address}`);
        log(`Match: ${recovered.toLowerCase() === address?.toLowerCase()}`);
      } catch (e: any) {
        log(`ecrecover failed (expected for smart wallets): ${e.message?.slice(0, 100)}`);
      }

      // Step 4: For ERC-6492, decode the signature structure
      if (isERC6492) {
        log("\n[4] Decoding ERC-6492 signature...");
        const sigBytes = sig.slice(2); // remove 0x
        const factory = "0x" + sigBytes.slice(24, 64); // bytes 12-32
        log(`Factory address: ${factory}`);

        // Find the WebAuthn JSON in the signature
        const jsonStart = sig.indexOf("7b2274797065"); // {"type in hex
        if (jsonStart > 0) {
          const jsonHex = sigBytes.slice(jsonStart - 2);
          try {
            // Find the closing brace
            let jsonStr = "";
            for (let i = 0; i < jsonHex.length - 1; i += 2) {
              const byte = parseInt(jsonHex.slice(i, i + 2), 16);
              if (byte >= 32 && byte < 127) {
                jsonStr += String.fromCharCode(byte);
              }
              if (jsonStr.endsWith("}") && jsonStr.includes('"challenge"')) {
                break;
              }
            }

            const match = jsonStr.match(/\{[^}]+\}/);
            if (match) {
              const clientDataJSON = match[0];
              log(`WebAuthn clientDataJSON: ${clientDataJSON}`);
              const parsed = JSON.parse(clientDataJSON);
              log(`  type: ${parsed.type}`);
              log(`  challenge: ${parsed.challenge}`);
              log(`  origin: ${parsed.origin}`);

              // Decode the challenge
              const challenge = parsed.challenge.replace(/-/g, "+").replace(/_/g, "/");
              const padded = challenge + "=".repeat((4 - (challenge.length % 4)) % 4);
              const challengeBytes = Buffer.from(padded, "base64");
              log(`  challenge (hex): ${challengeBytes.toString("hex")}`);
              log(`  challenge length: ${challengeBytes.length} bytes`);

              // Compare with our hash
              log(`\n[5] Comparing hashes...`);
              log(`Our EIP-191 hash:     ${hash.slice(2)}`);
              log(`WebAuthn challenge:   ${challengeBytes.toString("hex")}`);
              const hashMatch = hash.slice(2).toLowerCase() === challengeBytes.toString("hex").toLowerCase();
              log(`Direct match: ${hashMatch}`);

              if (!hashMatch) {
                log(`\nHashes don't match - the wallet is signing something different!`);
                log(`This is likely the replaySafeHash (EIP-712 wrapped)`);
              }
            }
          } catch (e: any) {
            log(`Failed to parse WebAuthn data: ${e.message}`);
          }
        }
      }

      log("\n--- SIGNING COMPLETE ---");
    } catch (e: any) {
      log(`ERROR: ${e.message}`);
      log(`Full error: ${JSON.stringify(e, null, 2)}`);
      console.error("Sign error:", e);
    }
  };

  const verifyWithViem = async () => {
    if (!signature || !address || !preparedMessage) {
      log("No signature or message to verify");
      return;
    }

    clearLogs();
    log("--- VIEM ERC-6492 VERIFICATION TEST ---");
    log(`Address: ${address}`);
    log(`Chain: ${chain?.name} (${chain?.id})`);
    log(`Message:\n${preparedMessage}`);

    try {
      const { createPublicClient, http } = await import("viem");

      // Try on Base first (where Coinbase Smart Wallet lives)
      log("\nVerifying on Base (chain 8453)...");
      const baseClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      const validOnBase = await baseClient.verifyMessage({
        address: address as `0x${string}`,
        message: preparedMessage,
        signature: signature as `0x${string}`,
      });
      log(`Result on Base: ${validOnBase ? "VALID" : "INVALID"}`);

      if (!validOnBase && chain?.id && chain.id !== 8453) {
        log(`\nTrying on connected chain (${chain.name})...`);
        const { http: httpTransport } = await import("viem");
        const currentChainClient = createPublicClient({
          chain: chain as any,
          transport: httpTransport(),
        });

        const validOnCurrentChain = await currentChainClient.verifyMessage({
          address: address as `0x${string}`,
          message: preparedMessage,
          signature: signature as `0x${string}`,
        });
        log(`Result on ${chain.name}: ${validOnCurrentChain ? "VALID" : "INVALID"}`);
      }
    } catch (e: any) {
      log(`ERROR: ${e.message}`);
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Smart Wallet Signature Test</h1>

      <div className="mb-6 space-y-2">
        <div className="text-sm text-gray-400">
          Status:{" "}
          {isConnected ? (
            <span className="text-green-400">
              Connected to {address?.slice(0, 10)}...{address?.slice(-6)}
              {chain && ` on ${chain.name}`}
            </span>
          ) : (
            <span className="text-yellow-400">Not connected</span>
          )}
        </div>
        {!isConnected ? (
          <button onClick={connectWallet} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Connect Wallet
          </button>
        ) : (
          <button onClick={() => disconnect()} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">
            Disconnect
          </button>
        )}
      </div>

      {isConnected && (
        <div className="mb-6 space-y-4">
          <div className="text-sm text-gray-400">Uses SIWE message format (same as main app)</div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={signPlainMessage} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">
              1. Sign SIWE Message
            </button>
            <button
              onClick={verifyWithViem}
              disabled={!signature}
              className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              2. Verify with Viem
            </button>
            <button onClick={clearLogs} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700">
              Clear Logs
            </button>
            <button
              onClick={() => {
                if (signature && preparedMessage && address) {
                  const debugData = JSON.stringify(
                    {
                      address,
                      message: preparedMessage,
                      signature,
                      chainId: chainId || 1,
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(debugData);
                  log("Copied debug data to clipboard!");
                }
              }}
              disabled={!signature}
              className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Copy Debug JSON
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded p-4 font-mono text-xs">
        <div className="text-gray-400 mb-2">Logs:</div>
        <div className="space-y-0.5 max-h-[600px] overflow-y-auto whitespace-pre-wrap">
          {logs.length === 0 ? (
            <div className="text-gray-500">Connect wallet and sign a message to see logs.</div>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                className={
                  l.includes("ERROR")
                    ? "text-red-400"
                    : l.includes("VALID")
                      ? "text-green-400"
                      : l.includes("INVALID")
                        ? "text-red-400"
                        : l.includes("Match: true")
                          ? "text-green-400"
                          : ""
                }
              >
                {l}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
