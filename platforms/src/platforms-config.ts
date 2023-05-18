import { PlatformSpec } from "./types";
import {
  Brightid,
  Coinbase,
  Discord,
  Ens,
  ETH,
  Facebook,
  Gitcoin,
  Github,
  GitPOAP,
  GnosisSafe,
  Google,
  GTC,
  GtcStaking,
  GuildXYZ,
  Lens,
  Linkedin,
  NFT,
  POAP,
  Poh,
  Snapshot,
  Twitter,
  ZkSync,
} from "./index";

export const getPlatformSpec = (platformName: string): PlatformSpec | undefined => {
  let platformspec: PlatformSpec | undefined = undefined;
  PLATFORMS.forEach((platform) => {
    if (platform.platform === platformName) {
      platformspec = platform;
    }
  });
  return platformspec;
};

export const PLATFORMS: PlatformSpec[] = [
  Brightid.BrightidPlatformDetails,
  Coinbase.CoinbasePlatformDetails,
  Discord.DiscordPlatformDetails,
  Ens.EnsPlatformDetails,
  ETH.ETHPlatformDetails,
  Facebook.FacebookPlatformDetails,
  Gitcoin.gitcoinPlatformDetails,
  Github.GithubPlatformDetails,
  GitPOAP.GitPOAPPlatformDetails,
  GnosisSafe.GnosisSafePlatformDetails,
  Google.GooglePlatformDetails,
  GTC.GTCPlatformDetails,
  GtcStaking.GTCStakingPlatformDetails,
  GuildXYZ.GuildXYZPlatformDetails,
  Lens.LensPlatformDetails,
  Linkedin.LinkedinPlatformDetails,
  NFT.NFTPlatformDetails,
  POAP.POAPPlatformDetails,
  Poh.PohPlatformDetails,
  Snapshot.SnapshotPlatformDetails,
  Twitter.TwitterPlatformDetails,
  ZkSync.ZkSyncPlatformDetails,
  // Signer.SignerPlatformDetails,
];
