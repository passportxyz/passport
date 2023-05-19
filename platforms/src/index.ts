// Provider Utils
import { Providers } from "./utils/providers";
import { SimpleProvider } from "./utils/simpleProvider";
import { ClearTextSimpleProvider } from "./utils/clearTextSimpleProvider";

// Platform Providers
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
import * as ClearText from "./ClearText";
import * as Brightid from "./Brightid";
import * as Coinbase from "./Coinbase";
import * as GuildXYZ from "./GuildXYZ";
import * as Civic from "./Civic";

export {
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
  Civic,
};

// Initiate providers - new Providers should be registered in this array...
export const providers = new Providers([
  // Example provider which verifies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
  new Google.GoogleProvider(),
  new Twitter.TwitterAuthProvider(),
  new Ens.EnsProvider(),
  new Poh.PohProvider(),
  new POAP.POAPProvider(),
  new Facebook.FacebookProvider(),
  new Facebook.FacebookFriendsProvider(),
  new Facebook.FacebookProfilePictureProvider(),
  new Brightid.BrightIdProvider(),
  new Github.GithubProvider(),
  new Github.FiveOrMoreGithubRepos(),
  new Github.TenOrMoreGithubFollowers(),
  new Github.FiftyOrMoreGithubFollowers(),
  new Github.ForkedGithubRepoProvider(),
  new Github.StarredGithubRepoProvider(),
  new ClearText.ClearTextGithubOrgProvider(),
  new ClearText.ClearTextTwitterProvider(),
  new Linkedin.LinkedinProvider(),
  new Discord.DiscordProvider(),
  new Twitter.TwitterTweetGT10Provider(),
  new Twitter.TwitterFollowerGT100Provider(),
  new Twitter.TwitterFollowerGT500Provider(),
  new Twitter.TwitterFollowerGTE1000Provider(),
  new Twitter.TwitterFollowerGT5000Provider(),
  new GtcStaking.SelfStakingBronzeProvider(),
  new GtcStaking.SelfStakingSilverProvider(),
  new GtcStaking.SelfStakingGoldProvider(),
  new GtcStaking.CommunityStakingBronzeProvider(),
  new GtcStaking.CommunityStakingSilverProvider(),
  new GtcStaking.CommunityStakingGoldProvider(),
  new ClearTextSimpleProvider(),
  new Snapshot.SnapshotProposalsProvider(),
  new Snapshot.SnapshotVotesProvider(),
  new ETH.EthGasProvider(),
  new ETH.FirstEthTxnProvider(),
  new ETH.EthGTEOneTxnProvider(),
  new GitPOAP.GitPOAPProvider(),
  /////////////////////////////////////////////////////////////
  // Start adding the specific gitcoin contributor providers
  /////////////////////////////////////////////////////////////
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 10,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 25,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 100,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 10,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 100,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 1000,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_rounds_contribute_to",
    recordAttribute: "numRoundsContributedToGte",
  }),
  new Gitcoin.GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_gr14_contributions",
    recordAttribute: "numGr14ContributionsGte",
  }),
  /////////////////////////////////////////////////////////////
  // Start adding the specific gitcoin grantee providers
  /////////////////////////////////////////////////////////////
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_owned_grants",
    recordAttribute: "numOwnedGrants",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 10,
    receivingAttribute: "num_grant_contributors",
    recordAttribute: "numGrantContributors",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 25,
    receivingAttribute: "num_grant_contributors",
    recordAttribute: "numGrantContributors",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 100,
    receivingAttribute: "num_grant_contributors",
    recordAttribute: "numGrantContributors",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 100,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmount",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 1000,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmount",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 10000,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmount",
  }),
  new Gitcoin.GitcoinGranteeStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_grants_in_eco_and_cause_rounds",
    recordAttribute: "numGrantsInEcoAndCauseRound",
  }),
  /////////////////////////////////////////////////////////////
  // Start adding ETH/GTC Possession Providers
  /////////////////////////////////////////////////////////////
  new GTC.EthErc20PossessionProvider({
    threshold: 100,
    recordAttribute: "gtcPossessionsGte",
    contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    error: "GTC Possessions >= 100 Provider verify Error",
  }),
  new GTC.EthErc20PossessionProvider({
    threshold: 10,
    recordAttribute: "gtcPossessionsGte",
    contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    error: "GTC Possessions >= 10 Provider verify Error",
  }),
  new ETH.EthErc20PossessionProvider({
    threshold: 32,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 32 Provider verify Error",
  }),
  new ETH.EthErc20PossessionProvider({
    threshold: 10,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 10 Provider verify Error",
  }),
  new ETH.EthErc20PossessionProvider({
    threshold: 1,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 1 Provider verify Error",
  }),
  /////////////////////////////////////////////////////////////
  // END
  ////////////////////////////////////////////////////////////
  new NFT.NFTProvider(),
  new Lens.LensProfileProvider(),
  new ZkSync.ZkSyncProvider(),
  new GnosisSafe.GnosisSafeProvider(),
  new Coinbase.CoinbaseProvider(),
  new GuildXYZ.GuildAdminProvider(),
  new GuildXYZ.GuildMemberProvider(),
  new GuildXYZ.GuildPassportMemberProvider(),
  /////////////////////////////////////////////////////////////
  // Civic Passes: Keep in sync with https://docs.civic.com/integration-guides/civic-idv-services/available-networks
  // By default, excludes testnets. To include testnets, add `includeTestnets: true` to each provider.
  ////////////////////////////////////////////////////////////
  new Civic.CivicPassProvider({
    passTypes: [Civic.CivicPassType.CAPTCHA],
    type: "CivicCaptchaPass",
  }),
  new Civic.CivicPassProvider({
    passTypes: [Civic.CivicPassType.UNIQUENESS],
    type: "CivicUniquenessPass",
  }),
  new Civic.CivicPassProvider({
    passTypes: [Civic.CivicPassType.LIVENESS],
    type: "CivicLivenessPass",
  }),
  new Civic.CivicPassProvider({
    passTypes: [Civic.CivicPassType.IDV],
    type: "CivicIDVPass",
  }),
]);

export { Platform, AppContext, ProviderPayload, PlatformSpec } from "./types";
export { Platform as PlatformClass } from "./utils/platform";
