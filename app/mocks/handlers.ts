import { http, HttpResponse } from "msw";
import { generateMockCredential, generateStampsForScenario, getCurrentScenario } from "./generators";
import scenarios from "./scenarios.json";

// Get base URLs from environment or use defaults
const SCORER_ENDPOINT = process.env.NEXT_PUBLIC_SCORER_ENDPOINT || "http://localhost:8002";
const IAM_URL = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "http://localhost:8003";

export const handlers = [
  // Skip wallet authentication for Scorer API
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/authenticate`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
    });
  }),

  // Mock getting passport data
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/passport`, ({ request }) => {
    const url = new URL(request.url);
    const address = url.searchParams.get("address") || "0x0000000000000000000000000000000000000001";
    const scenarioName = getCurrentScenario();
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    const stamps = generateStampsForScenario(scenarioName, address);

    return HttpResponse.json({
      passport: {
        stamps,
      },
    });
  }),

  // Mock score retrieval
  http.get(`${SCORER_ENDPOINT}/ceramic-cache/score/:scorer_id/:address`, ({ params }) => {
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

  // Mock stamp submission
  http.post(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      passportId: "mock-passport-id",
      stamps: body.stamps || [],
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

  // Mock stamp patching
  http.patch(`${SCORER_ENDPOINT}/ceramic-cache/stamps`, async ({ request }) => {
    const body = (await request.json()) as any;

    return HttpResponse.json({
      success: true,
      patched: body.stamps || [],
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
    return HttpResponse.json({
      Google: 1.0,
      Discord: 0.5,
      Github: 2.0,
      Twitter: 1.5,
      Linkedin: 1.0,
      NFT: 2.5,
      ETHBalance: 3.0,
      FirstEthTxnProvider: 1.5,
      GnosisSafe: 2.0,
      Snapshot: 1.5,
      ENS: 2.0,
      POH: 3.0,
      BrightId: 3.0,
      Civic: 3.0,
      CyberConnect: 1.0,
      Lens: 1.5,
    });
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
