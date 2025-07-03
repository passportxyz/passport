import { http, HttpResponse } from "msw";
import { generateMockCredential, generateStampsForScenario, getCurrentScenario } from "./generators";
import scenarios from "./scenarios.json";

// Get base URLs from environment or use defaults
const SCORER_ENDPOINT = "http://localhost:8002";
const IAM_URL = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "http://localhost:8003";

export const handlers = [
  // Skip wallet authentication for Scorer API
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/authenticate`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
    });
  }),

  // Also handle the URL pattern used by authenticate
  http.post(`http://localhost:8002/ceramic-cache/authenticate`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
    });
  }),

  // Mock nonce endpoint
  http.get(`${SCORER_ENDPOINT}/account/nonce`, () => {
    return HttpResponse.json({
      nonce: "mock-nonce-" + Date.now(),
    });
  }),

  // Mock getting passport data
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/stamp`, ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get("address") || "0x0000000000000000000000000000000000000001";
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    const stamps = generateStampsForScenario(scenarioName, address);

    return HttpResponse.json({
      success: true,
      stamps: stamps.map((stamp) => ({
        id: stamp.provider, // Use provider as ID since stamp.id is optional
        stamp: stamp.credential,
      })),
    });
  }),

  // Also handle the URL pattern used by PassportDatabase
  http.get(`http://localhost:8002/ceramic-cache/stamp`, ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get("address") || "0x0000000000000000000000000000000000000001";
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    const stamps = generateStampsForScenario(scenarioName, address);

    console.log("🔧 Dev Mode: Intercepted stamp request for address:", address);
    console.log("🔧 Dev Mode: Returning", stamps.length, "stamps for scenario:", scenarioName);

    // For new users with no stamps, we still return success
    // This ensures the passport is considered to exist (just empty)
    return HttpResponse.json({
      success: true,
      stamps: stamps.map((stamp) => ({
        id: stamp.provider, // Use provider as ID since stamp.id is optional
        stamp: stamp.credential,
      })),
    });
  }),

  // Mock score retrieval
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/score/:scorer_id/:address`, ({ params }) => {
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    const stamps = generateStampsForScenario(scenarioName, params.address as string);

    // Generate stamp_scores based on the stamps in the scenario
    const stamp_scores: Record<string, string> = {};
    const stampScoresV2: Record<string, { score: string; dedup: boolean }> = {};

    // Calculate individual stamp scores using the actual weights
    stamps.forEach((stamp) => {
      const provider = stamp.credential.credentialSubject.provider;
      // Get the actual weight for this provider from the weights endpoint
      const providerWeights: Record<string, number> = {
        // Social platforms
        Google: 1.0,
        Discord: 0.5,
        Github: 2.0,
        Twitter: 1.5,
        Linkedin: 1.0,
        TwitterAccountAgeGte365Days: 1.0,
        TwitterFollowerGT500: 1.5,
        TwitterTweetGte10: 0.5,
        TwitterAccountName: 0.5,
        FacebookFriends: 1.0,
        FacebookAccountAge: 1.0,
        FacebookProfilePicture: 0.5,
        InstagramFollowers: 1.0,
        InstagramAccountAge: 1.0,
        LinkedinProfilePicture: 0.5,
        // On-chain activity
        NFT: 2.5,
        ETHBalance: 3.0,
        FirstEthTxnProvider: 1.5,
        EthGasSpent: 2.0,
        EthTransactionCount: 1.5,
        // DeFi protocols
        GnosisSafe: 2.0,
        Snapshot: 1.5,
        ENS: 2.0,
        AaveDepositV2: 2.5,
        AaveDepositV3: 2.5,
        // Identity providers
        POH: 3.0,
        BrightId: 3.0,
        Civic: 3.0,
        CyberConnect: 1.0,
        Lens: 1.5,
        TrustaLabs: 2.0,
        IdenaState: 2.5,
        // Guild related
        GuildMember: 1.0,
        GuildAdmin: 2.0,
        GuildPassportMember: 1.5,
        GuildActiveMember: 1.5,
        // Gitcoin related
        GrantsContributor: 2.0,
        GitcoinDonations: 2.0,
        GitcoinTrustedGranteeProject: 3.0,
        GitcoinGrantApplications: 1.5,
        // L2s and other chains
        ZkSyncBalance: 2.0,
        ZkSyncAccount: 1.5,
        PolygonBalance: 2.0,
        OptimismBalance: 2.0,
        BaseBalance: 2.0,
        ScrollBalance: 2.0,
        ArbitrumBalance: 2.0,
        CeloBalance: 2.0,
        LineaBalance: 2.0,
        // Staking
        SelfStakingBronze: 2.0,
        SelfStakingSilver: 3.0,
        // Other
        CoinbaseVerifiedAccount: 2.0,
        AllowListVerified: 1.0,
      };
      const baseScore = providerWeights[provider] || 1.0;
      stamp_scores[provider] = baseScore.toString();
      stampScoresV2[provider] = {
        score: baseScore.toString(),
        dedup: false,
      };
    });

    return HttpResponse.json({
      address: params.address,
      score: scenario.score.toString(),
      status: "DONE",
      last_score_timestamp: new Date().toISOString(),
      evidence: scenario.evidence || {
        success: true,
        type: "MOCK",
      },
      error: null,
      // Include both legacy and v2 formats for compatibility
      stamp_scores,
      stamps: stampScoresV2,
      passing_score: scenario.score >= 20,
      threshold: "20.0",
    });
  }),

  // Mock score retrieval without scorer_id (used by scorerContext)
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/score/:address`, ({ params }) => {
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    const stamps = generateStampsForScenario(scenarioName, params.address as string);

    // Generate stamp_scores based on the stamps in the scenario
    const stamp_scores: Record<string, string> = {};
    const stampScoresV2: Record<string, { score: string; dedup: boolean }> = {};

    // Calculate individual stamp scores using the actual weights
    stamps.forEach((stamp) => {
      const provider = stamp.credential.credentialSubject.provider;
      // Get the actual weight for this provider from the weights endpoint
      const providerWeights: Record<string, number> = {
        // Social platforms
        Google: 1.0,
        Discord: 0.5,
        Github: 2.0,
        Twitter: 1.5,
        Linkedin: 1.0,
        TwitterAccountAgeGte365Days: 1.0,
        TwitterFollowerGT500: 1.5,
        TwitterTweetGte10: 0.5,
        TwitterAccountName: 0.5,
        FacebookFriends: 1.0,
        FacebookAccountAge: 1.0,
        FacebookProfilePicture: 0.5,
        InstagramFollowers: 1.0,
        InstagramAccountAge: 1.0,
        LinkedinProfilePicture: 0.5,
        // On-chain activity
        NFT: 2.5,
        ETHBalance: 3.0,
        FirstEthTxnProvider: 1.5,
        EthGasSpent: 2.0,
        EthTransactionCount: 1.5,
        // DeFi protocols
        GnosisSafe: 2.0,
        Snapshot: 1.5,
        ENS: 2.0,
        AaveDepositV2: 2.5,
        AaveDepositV3: 2.5,
        // Identity providers
        POH: 3.0,
        BrightId: 3.0,
        Civic: 3.0,
        CyberConnect: 1.0,
        Lens: 1.5,
        TrustaLabs: 2.0,
        IdenaState: 2.5,
        // Guild related
        GuildMember: 1.0,
        GuildAdmin: 2.0,
        GuildPassportMember: 1.5,
        GuildActiveMember: 1.5,
        // Gitcoin related
        GrantsContributor: 2.0,
        GitcoinDonations: 2.0,
        GitcoinTrustedGranteeProject: 3.0,
        GitcoinGrantApplications: 1.5,
        // L2s and other chains
        ZkSyncBalance: 2.0,
        ZkSyncAccount: 1.5,
        PolygonBalance: 2.0,
        OptimismBalance: 2.0,
        BaseBalance: 2.0,
        ScrollBalance: 2.0,
        ArbitrumBalance: 2.0,
        CeloBalance: 2.0,
        LineaBalance: 2.0,
        // Staking
        SelfStakingBronze: 2.0,
        SelfStakingSilver: 3.0,
        // Other
        CoinbaseVerifiedAccount: 2.0,
        AllowListVerified: 1.0,
      };
      const baseScore = providerWeights[provider] || 1.0;
      stamp_scores[provider] = baseScore.toString();
      stampScoresV2[provider] = {
        score: baseScore.toString(),
        dedup: false,
      };
    });

    return HttpResponse.json({
      address: params.address,
      score: scenario.score.toString(),
      status: "DONE",
      last_score_timestamp: new Date().toISOString(),
      evidence: scenario.evidence || {
        success: true,
        type: "MOCK",
      },
      error: null,
      // Include both legacy and v2 formats for compatibility
      stamp_scores,
      stamps: stampScoresV2,
      passing_score: scenario.score >= 20,
      threshold: "20.0",
    });
  }),

  // Mock stamp submission
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      passportId: "mock-passport-id",
      stamps: body.stamps || [],
    });
  }),

  // Mock stamp bulk submission (used by PassportDatabase.addStamps)
  http.post(`http://localhost:8002/ceramic-cache/stamps/bulk`, async ({ request }) => {
    const body = (await request.json()) as any;
    console.log("🔧 Dev Mode: Bulk stamp submission intercepted, stamps:", body.length);

    return HttpResponse.json({
      success: true,
      stamps: body.map((stampData: any) => ({
        id: stampData.provider,
        stamp: stampData.stamp,
      })),
    });
  }),

  // Mock stamp deletion
  http.delete(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      deleted: body.providers || [],
    });
  }),

  // Mock stamp bulk deletion (used by PassportDatabase.deleteStamps)
  http.delete(`http://localhost:8002/ceramic-cache/stamps/bulk`, async ({ request }) => {
    const body = (await request.json()) as any;
    console.log("🔧 Dev Mode: Bulk stamp deletion intercepted, providers:", body.length);

    return HttpResponse.json({
      success: true,
      stamps: [], // Return empty stamps after deletion
    });
  }),

  // Mock stamp patching
  http.patch(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      patched: body.stamps || [],
    });
  }),

  // Mock stamp bulk patching (used by PassportDatabase.patchStamps)
  http.patch(`http://localhost:8002/ceramic-cache/stamps/bulk`, async ({ request }) => {
    const body = (await request.json()) as any;
    console.log("🔧 Dev Mode: Bulk stamp patching intercepted, stamps:", body.length);

    return HttpResponse.json({
      success: true,
      stamps: body.map((stampData: any) => ({
        id: stampData.provider,
        stamp: stampData.stamp,
      })),
    });
  }),

  // Mock getting available stamps/providers
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, () => {
    return HttpResponse.json({
      stamps: [
        "Google",
        "Discord",
        "Github",
        "Twitter",
        "Linkedin",
        "NFT",
        "ETHBalance",
        "FirstEthTxnProvider",
        "GnosisSafe",
        "Snapshot",
        "ENS",
        "POH",
        "BrightId",
        "Civic",
        "CyberConnect",
        "Lens",
      ],
    });
  }),

  // Mock challenge generation from IAM
  http.post(`${IAM_URL}/api/v0.0.0/challenge`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      credential: generateMockCredential("challenge", body.address || "0xDEV123456789ABCDEF123456789ABCDEF123456"),
      record: {
        challenge: "mock-challenge-" + Date.now(),
        address: body.address,
      },
    });
  }),

  // Mock stamp verification
  http.post(`${IAM_URL}/api/v0.0.0/verify`, async ({ request }) => {
    const body = (await request.json()) as any;
    const { type, address } = body;

    // Simulate some stamps failing verification
    const failedStamps = ["FailingProvider", "ErrorProvider"];
    if (failedStamps.includes(type)) {
      return HttpResponse.json(
        {
          credential: null,
          error: `Verification failed for ${type}`,
          code: 400,
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      credential: generateMockCredential(type, address),
      record: {
        type,
        address,
        version: "0.0.0",
      },
      signature: "0x" + "b".repeat(130),
      challenge: body.challenge,
    });
  }),

  // Mock Eas Passport retrieval
  http.post(`${IAM_URL}/api/v0.0.0/eas/passport`, async ({ request }) => {
    const body = (await request.json()) as any;
    const scenarioName = getCurrentScenario();
    const stamps = generateStampsForScenario(scenarioName, body.address);

    return HttpResponse.json({
      passport: {
        stamps,
      },
    });
  }),

  // Mock checking on-chain status
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/check-on-chain/:address`, ({ params }) => {
    return HttpResponse.json({
      onChain: true,
      address: params.address,
      attestation: {
        id: "0x" + "c".repeat(64),
        recipient: params.address,
        attester: "0x" + "d".repeat(40),
        time: Math.floor(Date.now() / 1000),
        data: "0x",
      },
    });
  }),

  // Mock refreshing score
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/refresh-score`, async ({ request }) => {
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];

    return HttpResponse.json({
      success: true,
      score: scenario.score,
    });
  }),

  // Mock getting weights for stamp scoring
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/weights`, () => {
    // Comprehensive weights for all providers used in scenarios
    const weights: Record<string, number> = {
      // Social platforms
      Google: 1.0,
      Discord: 0.5,
      Github: 2.0,
      Twitter: 1.5,
      Linkedin: 1.0,
      TwitterAccountAgeGte365Days: 1.0,
      TwitterFollowerGT500: 1.5,
      TwitterTweetGte10: 0.5,
      TwitterAccountName: 0.5,
      FacebookFriends: 1.0,
      FacebookAccountAge: 1.0,
      FacebookProfilePicture: 0.5,
      InstagramFollowers: 1.0,
      InstagramAccountAge: 1.0,
      LinkedinProfilePicture: 0.5,

      // On-chain activity
      NFT: 2.5,
      ETHBalance: 3.0,
      FirstEthTxnProvider: 1.5,
      EthGasSpent: 2.0,
      EthTransactionCount: 1.5,

      // DeFi protocols
      GnosisSafe: 2.0,
      Snapshot: 1.5,
      ENS: 2.0,
      AaveDepositV2: 2.5,
      AaveDepositV3: 2.5,

      // Identity providers
      POH: 3.0,
      BrightId: 3.0,
      Civic: 3.0,
      CyberConnect: 1.0,
      Lens: 1.5,
      TrustaLabs: 2.0,
      IdenaState: 2.5,

      // Guild related
      GuildMember: 1.0,
      GuildAdmin: 2.0,
      GuildPassportMember: 1.5,
      GuildActiveMember: 1.5,

      // Gitcoin related
      GrantsContributor: 2.0,
      GitcoinDonations: 2.0,
      GitcoinTrustedGranteeProject: 3.0,
      GitcoinGrantApplications: 1.5,

      // L2s and other chains
      ZkSyncBalance: 2.0,
      ZkSyncAccount: 1.5,
      PolygonBalance: 2.0,
      OptimismBalance: 2.0,
      BaseBalance: 2.0,
      ScrollBalance: 2.0,
      ArbitrumBalance: 2.0,
      CeloBalance: 2.0,
      LineaBalance: 2.0,

      // Staking
      SelfStakingBronze: 2.0,
      SelfStakingSilver: 3.0,

      // Other
      CoinbaseVerifiedAccount: 2.0,
      AllowListVerified: 1.0,
    };

    return HttpResponse.json(weights);
  }),

  // Mock admin banners
  http.get(`${SCORER_ENDPOINT}/passport-admin/banners`, () => {
    return HttpResponse.json({
      banners: [],
    });
  }),

  // Mock getting passport data with address in URL
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/passport/:address`, ({ params }) => {
    const address = (params.address as string) || "0x0000000000000000000000000000000000000001";
    const scenarioName = getCurrentScenario();
    const stamps = generateStampsForScenario(scenarioName, address);

    return HttpResponse.json({
      passport: {
        stamps,
      },
    });
  }),

  // Mock POST score endpoint (for score calculation)
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/score/:address`, ({ params }) => {
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];

    return HttpResponse.json({
      address: params.address,
      score: scenario.score.toString(),
      status: "DONE",
      last_score_timestamp: new Date().toISOString(),
      evidence: scenario.evidence || {
        success: true,
        type: "MOCK",
      },
      error: null,
    });
  }),
];

// Additional utility handlers for error scenarios
export const errorHandlers = [
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/passport`, () => {
    return HttpResponse.json({ error: "Network error", code: 500 }, { status: 500 });
  }),

  http.get(`${SCORER_ENDPOINT}/ceramic-cache/score/:scorer_id/:address`, () => {
    return HttpResponse.json({ error: "Score calculation failed", code: 500 }, { status: 500 });
  }),
];
