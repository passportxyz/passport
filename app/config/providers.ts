import { PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-types";
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
  Hypercerts,
  Lens,
  Linkedin,
  NFT,
  POAP,
  Poh,
  Snapshot,
  Twitter,
  ZkSync,
} from "@gitcoin/passport-platforms";

export type ProviderSpec = {
  title: string;
  name: PROVIDER_ID;
  icon?: string;
  description?: string;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};

export type UpdatedPlatforms = {
  [key: string]: boolean;
};

// Platform -> Provider[]
export type Providers = {
  [platform in PLATFORM_ID]: PlatformGroupSpec[];
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: Google.GoogleProviderConfig,
  Ens: Ens.EnsProviderConfig,
  Poh: Poh.PohProviderConfig,
  Twitter: Twitter.TwitterProviderConfig,
  POAP: POAP.POAPProviderConfig,
  Facebook: Facebook.FacebookProviderConfig,
  Brightid: Brightid.BrightidProviderConfig,
  Github: Github.GithubProviderConfig,
  Gitcoin: Gitcoin.GitcoinProviderConfig,
  GitPOAP: GitPOAP.GitPOAPProviderConfig,
  GnosisSafe: GnosisSafe.GnosisSafeProviderConfig,
  GTC: GTC.GTCProviderConfig,
  GtcStaking: GtcStaking.GTCStakingProviderConfig,
  ETH: ETH.ETHProviderConfig,
  Snapshot: Snapshot.SnapshotProviderConfig,
  NFT: NFT.NFTProviderConfig,
  ZkSync: ZkSync.ZkSyncProviderConfig,
  Lens: Lens.LensProviderConfig,
  Discord: Discord.DiscordProviderConfig,
  Linkedin: Linkedin.LinkedinProviderConfig,
  Coinbase: Coinbase.CoinbaseProviderConfig,
  GuildXYZ: GuildXYZ.GuildXYZProviderConfig,
  Hypercerts: Hypercerts.HypercertsProviderConfig,
  Signer: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Signer" }],
    },
  ],
};
