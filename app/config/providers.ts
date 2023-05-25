import * as ethers from "ethers";
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
  Civic,
} from "@gitcoin/passport-platforms";

export type ProviderSpec = {
  title: string;
  name: PROVIDER_ID;
  hash?: string;
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

const stampProviders: Readonly<Providers> = {
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
  Civic: Civic.CivicProviderConfig,
};

Object.keys(stampProviders).forEach((platformGroup) => {
  stampProviders[platformGroup as PLATFORM_ID].forEach((platformGroupSpec: PlatformGroupSpec) => {
    platformGroupSpec.providers.forEach((providerSpec: any) => {
      providerSpec.hash = ethers.keccak256(ethers.toUtf8Bytes(providerSpec.name));
    });
  });
});

export const STAMP_PROVIDERS: Readonly<Providers> = stampProviders;
