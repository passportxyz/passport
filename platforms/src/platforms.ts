import * as Twitter from "./Twitter";
import * as Ens from "./Ens";
import * as Facebook from "./Facebook";
import * as Github from "./Github";
import * as Gitcoin from "./Gitcoin";
import * as Lens from "./Lens";
import * as Poh from "./Poh";
import * as Snapshot from "./Snapshot";
import * as GnosisSafe from "./GnosisSafe";
import * as NFT from "./NFT";
import * as POAP from "./POAP";
import * as ETH from "./ETH";
import * as ZkSync from "./ZkSync";
import * as Discord from "./Discord";
import * as Linkedin from "./Linkedin";
import * as GtcStaking from "./GtcStaking";
import * as Google from "./Google";
import * as Brightid from "./Brightid";
import * as Coinbase from "./Coinbase";
import * as GuildXYZ from "./GuildXYZ";
import * as Hypercerts from "./Hypercerts";
import * as PHI from "./PHI";
import * as Holonym from "./Holonym";
import * as Idena from "./Idena";
import * as Civic from "./Civic";
import { PlatformSpec, PlatformGroupSpec, Provider } from "./types";

type PlatformConfig = {
  PlatformDetails: PlatformSpec;
  ProviderConfig: PlatformGroupSpec[];
  providers: Provider[];
  [key: string]: any;
};

// Order of this array determines order in the Passport UI
const platforms: Record<string, PlatformConfig> = {
  GtcStaking,
  Gitcoin,
  Twitter,
  Discord,
  Google,
  Github,
  Facebook,
  Linkedin,
  Ens,
  Brightid,
  Poh,
  ETH,
  Snapshot,
  NFT,
  ZkSync,
  Lens,
  GnosisSafe,
  Coinbase,
  GuildXYZ,
  Hypercerts,
  PHI,
  Holonym,
  Idena,
  Civic,
};

if (process.env.NEXT_PUBLIC_FF_NEW_POAP_STAMPS === "on") {
  platforms.POAP = POAP;
}

export default platforms;
