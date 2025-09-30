/*
  Simple token generator for embed load tests
  - Reads addresses from ../test_data/generated_accounts_<NUM_ACCOUNTS>.json
  - Writes ./user-tokens.json mapping address -> dummy bearer token
*/

const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", { encoding: "utf-8" });
}

function main() {
  const numAccounts = parseInt(process.env.NUM_ACCOUNTS || "100", 10);
  const dataDir = path.resolve(__dirname, "../test_data");
  const candidates = [
    path.join(dataDir, `generated_accounts_${numAccounts}.json`),
    path.join(dataDir, "generated_accounts_100.json"),
  ];

  let accountsPath;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      accountsPath = p;
      break;
    }
  }

  if (!accountsPath) {
    console.error(`Could not find generated accounts in: ${candidates.join(", ")}. Please generate test_data first.`);
    process.exit(1);
  }

  const accountsRaw = readJson(accountsPath);
  if (!Array.isArray(accountsRaw) || accountsRaw.length === 0) {
    console.error("No addresses found in accounts file.");
    process.exit(1);
  }

  const tokens = {};
  for (const item of accountsRaw) {
    const addr = typeof item === "string" ? item : item && item.address ? item.address : undefined;
    if (!addr || typeof addr !== "string") continue;
    tokens[addr] = `test-token-${addr.toLowerCase()}`;
  }

  const outPath = path.resolve(__dirname, "user-tokens.json");
  writeJson(outPath, tokens);
  console.log(`Wrote ${Object.keys(tokens).length} tokens to ${outPath}`);
}

main();
