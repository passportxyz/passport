import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";

import {
  Brightid,
  ClearText,
  Google,
  GtcStaking,
  GTC,
  Linkedin,
  Discord,
  ZkSync,
  ETH,
  POAP,
  GitPOAP,
  NFT,
  GnosisSafe,
  Snapshot,
  Poh,
  Lens,
  Gitcoin,
  Github,
  Facebook,
  Ens,
  Twitter,
  Coinbase,
  GuildXYZ,
} from "@gitcoin/passport-platforms";

const platforms = [
  Brightid,
  ClearText,
  Google,
  GtcStaking,
  GTC,
  Linkedin,
  Discord,
  ZkSync,
  ETH,
  POAP,
  GitPOAP,
  NFT,
  GnosisSafe,
  Snapshot,
  Poh,
  Lens,
  Gitcoin,
  Github,
  Facebook,
  Ens,
  Twitter,
  Coinbase,
  GuildXYZ,
];

dotenv.config();

const platformData = [];

// Parse platforms and write to a JSON file in the public directory
writeFileSync(join(__dirname, "public", "providers.json"), JSON.stringify(platformData));
