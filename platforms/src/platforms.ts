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
import * as GitPOAP from "./GitPOAP";
import * as POAP from "./POAP";
import * as ETH from "./ETH";
import * as ZkSync from "./ZkSync";
import * as Discord from "./Discord";
import * as Linkedin from "./Linkedin";
import * as GTC from "./GTC";
import * as GtcStaking from "./GtcStaking";
import * as Google from "./Google";
import * as Brightid from "./Brightid";
import * as Coinbase from "./Coinbase";
import * as GuildXYZ from "./GuildXYZ";
import * as Hypercerts from "./Hypercerts";
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
  GTC,
  GtcStaking,
  Gitcoin,
  Twitter,
  Discord,
  Google,
  Github,
  Facebook,
  Linkedin,
  Ens,
  POAP,
  Brightid,
  Poh,
  ETH,
  Snapshot,
  GitPOAP,
  NFT,
  ZkSync,
  Lens,
  GnosisSafe,
  Coinbase,
  GuildXYZ,
  Hypercerts,
  Civic,
};

export default platforms;
