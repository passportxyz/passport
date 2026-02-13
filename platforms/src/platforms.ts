import * as Ens from "./Ens/index.js";
import * as Github from "./Github/index.js";
import * as Gitcoin from "./Gitcoin/index.js";
import * as Lens from "./Lens/index.js";
import * as Snapshot from "./Snapshot/index.js";
import * as GnosisSafe from "./GnosisSafe/index.js";
import * as NFT from "./NFT/index.js";
import * as POAP from "./POAP/index.js";
import * as ETH from "./ETH/index.js";
import * as ZkSync from "./ZkSync/index.js";
import * as Discord from "./Discord/index.js";
import * as Linkedin from "./Linkedin/index.js";
import * as GtcStaking from "./GtcStaking/index.js";
import * as Google from "./Google/index.js";
import * as Brightid from "./Brightid/index.js";
import * as Coinbase from "./Coinbase/index.js";
import * as GuildXYZ from "./GuildXYZ/index.js";
import * as Idena from "./Idena/index.js";
import * as Civic from "./Civic/index.js";
import * as TrustaLabs from "./TrustaLabs/index.js";
import * as Outdid from "./Outdid/index.js";
import * as AllowList from "./AllowList/index.js";
import * as Binance from "./Binance/index.js";
import * as CustomGithub from "./CustomGithub/index.js";
import * as CustomNFT from "./CustomNFT/index.js";
import * as CleanHands from "./CleanHands/index.js";
import * as HumanIdPhone from "./HumanIdPhone/index.js";
import * as HumanIdKyc from "./HumanIdKyc/index.js";
import * as Biometrics from "./Biometrics/index.js";
import * as ZKEmail from "./ZKEmail/index.js";
import * as X from "./X/index.js";
import * as Steam from "./Steam/index.js";

import { PlatformSpec, PlatformGroupSpec, Provider } from "./types.js";

export type PlatformConfig = {
  PlatformDetails: PlatformSpec;
  ProviderConfig: PlatformGroupSpec[];
  providers: Provider[];
  [key: string]: any;
};

// Order of this array determines order in the Passport UI
const platforms: Record<string, PlatformConfig> = {
  GtcStaking,
  Gitcoin,
  Discord,
  Google,
  Github,
  Linkedin,
  Ens,
  Brightid,
  ETH,
  Snapshot,
  NFT,
  ZkSync,
  Lens,
  GnosisSafe,
  Coinbase,
  GuildXYZ,
  Idena,
  Civic,
  TrustaLabs,
  Outdid,
  AllowList,
  Binance,
  CustomGithub,
  CustomNFT,
  CleanHands,
  HumanIdKyc,
  HumanIdPhone,
  Biometrics,
  ZKEmail,
  X,
  Steam,
};

if (process.env.NEXT_PUBLIC_FF_NEW_POAP_STAMPS === "on") {
  platforms.POAP = POAP;
}

export default platforms;
