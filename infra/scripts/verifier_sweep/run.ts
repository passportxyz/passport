import * as dotenv from "dotenv";
dotenv.config();

import { runSweeper } from "./src/index";

const showHelp = () => {
  console.log(`
Gitcoin Passport Verifier Sweep Tool

This tool sweeps ETH from verifier wallets to designated destination addresses when balances exceed a threshold.

Usage:
  yarn start [options]

Options:
  --env     Load configuration from environment variables instead of AWS Secrets Manager
  --help    Show this help message

Environment Variables:
  Required for all modes:
    CHAIN_DEPOSIT_ADDRESSES   JSON object mapping chain names to destination addresses
                             Example: {"eth-mainnet": "0x123...", "polygon-mainnet": "0x456..."}
    
  Optional:
    BALANCE_THRESHOLD_ETH    ETH balance threshold to trigger sweep (default: 0.25)
    
  Required when using --env flag:
    ALCHEMY_API_KEY         Alchemy API key for RPC access
    PRIVATE_KEY             Private key of the wallet to sweep from
    
  Required when using AWS Secrets Manager (default):
    SECRETS_ARN             ARN of the AWS secret containing ALCHEMY_API_KEY and PRIVATE_KEY

Examples:
  # Using environment variables
  ALCHEMY_API_KEY=your_key PRIVATE_KEY=0x... CHAIN_DEPOSIT_ADDRESSES='{"eth-mainnet":"0x..."}' yarn start --env
  
  # Using AWS Secrets Manager
  SECRETS_ARN=arn:aws:secretsmanager:... CHAIN_DEPOSIT_ADDRESSES='{"eth-mainnet":"0x..."}' yarn start

Notes:
  - The tool will check each configured chain and sweep funds if the balance exceeds the threshold
  - A minimum of 0.01 ETH is retained in the wallet for future gas costs
  - All destination addresses must be valid Ethereum addresses
`);
};

// Check for help flags or no arguments
const args = process.argv.slice(2);
const helpFlags = ["--help", "-h", "help", "-help", "h", "?", "--h"];
const showHelpAndExit = () => {
  showHelp();
  process.exit(0);
};

if (args.length === 0 || helpFlags.some((flag) => args.includes(flag))) {
  showHelpAndExit();
}

const useEnv = process.argv.includes("--env");

runSweeper(useEnv)
  .then(console.log)
  .catch((error: any) => {
    console.error("Error:", error);
    process.exit(1);
  });
